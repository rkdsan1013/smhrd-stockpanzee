// alpha_vantage.ts

import axios from "axios";
import puppeteer, { Browser, Page } from "puppeteer";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

// 타입 정의

interface FeedItem {
  title: string;
  summary?: string;
  url: string;
  published_at: string;
  [key: string]: any;
}

interface ArticleData {
  body: string | null;
  image: string | null;
}

// 설정

const API_KEY = "O89CDQD2HSSGTW83"; // Alpha Vantage 키
const LIMIT = 50; // 한 번에 최대 50개 헤드라인
const SORT = "LATEST"; // 정렬 방식
const INTERVAL_MS = 58 * 60 * 1000; // 58분 간격

const KEYWORDS = [
  "stock",
  "shares",
  "NASDAQ",
  "NYSE",
  "earnings",
  "IPO",
  "merger",
  "acquisition",
  "buyback",
  "dividend",
  "guidance",
  "forecast",
  "revenue",
  "profit",
  "loss",
  "downgrade",
  "upgrade",
  "split",
  "layoff",
  "bankruptcy",
  "AI",
  "technology",
  "chip",
  "semiconductor",
  "inflation",
  "interest rate",
];

let lastResetTime = Date.now();
const RESET_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7일

const seenUrls = new Set<string>();

// 유틸 함수

function isLikelyStockNews(item: FeedItem): boolean {
  const txt = (item.title + " " + (item.summary || "")).toLowerCase();
  return KEYWORDS.some((k) => txt.includes(k.toLowerCase()));
}

function maybeResetSeenUrls(): void {
  const now = Date.now();
  if (now - lastResetTime >= RESET_INTERVAL_MS) {
    seenUrls.clear();
    lastResetTime = now;
    console.log("♻️ seenUrls 캐시를 초기화했습니다 (1주 경과)");
  }
}

async function fetchNewsFeed(): Promise<FeedItem[]> {
  try {
    const res = await axios.get("https://www.alphavantage.co/query", {
      params: {
        function: "NEWS_SENTIMENT",
        apikey: API_KEY,
        limit: LIMIT,
        sort: SORT,
      },
      timeout: 30000,
    });

    const data = res.data as { feed?: FeedItem[] };
    return data.feed || [];
  } catch (err: any) {
    console.error("❌ 뉴스 API 오류:", err.response?.data || err.message);
    return [];
  }
}

// 본문/이미지 추출

async function extractArticleData(url: string): Promise<ArticleData> {
  let browser: Browser | null = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page: Page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

    // ─── ① 페이지 로드: 타임아웃 별도 처리 ───
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    } catch (err: any) {
      console.error(`❌ 페이지 로드 타임아웃 (${url}):`, err.message);
      return { body: null, image: null };
    }

    // ─── (1) 배너/쿠키 동의 클릭 시도 (XPath → document.evaluate) ───
    await page.evaluate(() => {
      const xpath =
        "//button[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'accept')" +
        " or contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'continue')]";
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      );
      const btn = result.singleNodeValue as HTMLElement | null;
      if (btn) btn.click();
    });
    // 1초 대기
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // ─── (2) 정책 문구 제거 ───
    await page.evaluate(() => {
      (document.querySelectorAll("body *") as NodeListOf<HTMLElement>).forEach((el) => {
        if (/Do not sell or share my personal information/i.test(el.innerText)) {
          el.remove();
        }
      });
    });

    // ─── (3) 대표 이미지: meta 태그 우선 ───
    let image: string | null =
      (await page
        .$eval('meta[property="og:image"]', (el) => (el as HTMLMetaElement).content)
        .catch(() => null)) ||
      (await page
        .$eval('meta[name="twitter:image"]', (el) => (el as HTMLMetaElement).content)
        .catch(() => null));

    // ─── (4) 페이지 HTML 가져오기 ───
    let html = await page.content();
    await browser.close();
    browser = null;

    // ─── (5) 스타일/링크 제거 ───
    html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
    html = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, "");

    // ─── (6) Readability로 본문 파싱 ───
    const dom = new JSDOM(html, { url });
    const article = new Readability(dom.window.document).parse();
    const body = article?.textContent?.trim() || null;

    // ─── (7) meta 이미지 없으면 첫 번째 <img> 사용 ───
    if (!image && article?.content) {
      const tempDom = new JSDOM(article.content);
      const imgEl = tempDom.window.document.querySelector("img");
      if (imgEl && (imgEl as HTMLImageElement).src) {
        image = (imgEl as HTMLImageElement).src;
      }
    }

    return { body, image };
  } catch (err: any) {
    console.error(`❌ 본문/이미지 추출 실패 (${url}):`, err.message);
    return { body: null, image: null };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 메인 실행 로직

async function run(): Promise<void> {
  console.log(`\n⏱️ ${new Date().toLocaleString()} - 뉴스 수집 시작`);

  maybeResetSeenUrls();

  const feed = await fetchNewsFeed();
  console.log(`▶️ API로 받아온 기사 수: ${feed.length}`);

  const stockNews = feed.filter(isLikelyStockNews);
  console.log(`▶️ 필터링된 주식 뉴스: ${stockNews.length}`);

  for (const [i, item] of stockNews.entries()) {
    // ─── ② 루프 진입 직후에 중복 URL 처리 ───
    if (seenUrls.has(item.url)) continue;
    seenUrls.add(item.url);

    console.log(`\n[${i + 1}] ${item.published_at} | ${item.title}`);
    console.log(`  URL:     ${item.url}`);
    console.log(`  Summary: ${item.summary || "—"}`);

    const { body, image } = await extractArticleData(item.url);

    // ─── 오류 난 기사는 건너뛰기 ───
    if (!body && !image) {
      console.log("  ⚠️ 이 기사는 건너뜁니다.\n");
      continue;
    }

    if (body) console.log(`📄 본문:\n${body}\n`);
    if (image) console.log(`🖼️ 이미지: ${image}\n`);
  }

  if (stockNews.length === 0) {
    console.log("❗️현재 조건에 맞는 주식 뉴스가 없습니다.");
  }
}

// 최초 실행 및 주기 실행
run();
setInterval(run, INTERVAL_MS);
