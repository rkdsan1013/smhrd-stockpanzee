import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

// selectorMap.json 불러오기
const selectorPath = path.resolve(__dirname, "../../config/selectorMap.json");
const selectorMap: { [domain: string]: string } = JSON.parse(fs.readFileSync(selectorPath, "utf-8"));

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "";
  }
}

export async function getArticleContent(url: string): Promise<string> {
  try {
    const res = await axios.get<string>(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(res.data);
    const domain = extractDomain(url);
    const selector = selectorMap[domain];

    if (selector) {
      const content = $(selector).text().trim();
      if (content.length > 50) return content;
    }

    console.warn(`❗ 본문 selector 매칭 실패: ${domain}`);
    return "";
  } catch {
    console.warn(`❌ 기사 본문 크롤링 실패: ${url}`);
    return "";
  }
}