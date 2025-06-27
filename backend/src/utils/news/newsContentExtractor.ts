// /backend/src/utils/newsContentExtractor.ts
import axios from "axios";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import puppeteer, { Browser } from "puppeteer";

const READABILITY_MIN_LENGTH = 200;

/**
 * 1) Axios로 HTML 가져오기 (10초 타임아웃, 모바일 UA)
 */
async function fetchHtml(url: string): Promise<string | null> {
  try {
    const { data: html } = await axios.get<string>(url, {
      timeout: 10_000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) " +
          "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1",
      },
    });
    return html;
  } catch {
    return null;
  }
}

/**
 * 2) Readability로 본문만 뽑아내기
 */
function extractByReadability(html: string, url: string): string | null {
  try {
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();
    const text = article?.textContent?.trim() || "";
    return text.length >= READABILITY_MIN_LENGTH ? text : null;
  } catch {
    return null;
  }
}

/**
 * 3) Puppeteer 폴백: 네트워크 idle0까지 대기 후 Readability
 */
async function extractWithPuppeteer(url: string): Promise<string | null> {
  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: ["domcontentloaded", "networkidle0"],
      timeout: 30_000,
    });

    const html = await page.content();
    return extractByReadability(html, url);
  } catch {
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * 메인 추출 함수:
 *  Axios → Readability → Puppeteer 순으로 시도
 */
export async function extractFullContent(url: string): Promise<string | null> {
  const html = await fetchHtml(url);
  if (!html) return null;

  const byReadability = extractByReadability(html, url);
  if (byReadability) return byReadability;

  // Readability가 짧게 나오거나 실패 시 Puppeteer 폴백
  return await extractWithPuppeteer(url);
}
