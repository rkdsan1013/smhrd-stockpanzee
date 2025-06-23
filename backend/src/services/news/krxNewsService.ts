// /backend/src/services/news/krxNewsService.ts

import axios from "axios";
import puppeteer from "puppeteer";
import cron from "node-cron";
import * as cheerio from "cheerio";
import { mapKrxNews, NaverNewsApiItem } from "../../utils/news/krxNewsMapper";
import { findAllAssets } from "../../models/assetModel";
// import { createNewsWithAnalysis } from "../../models/newsTransactions";
import { analyzeNews } from "../../ai/gptNewsAnalysis";

const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const NAVER_API_URL = "https://openapi.naver.com/v1/search/news.json";

interface NaverApiResponse {
  items: NaverNewsApiItem[];
}

let collectedLinks: Set<string> = new Set();

export const fetchAndProcessSmartKrxNews = async (): Promise<void> => {
  try {
    console.log("📢 주식 뉴스 수집 시작");

    const response = await axios.get<NaverApiResponse>(NAVER_API_URL, {
      params: { query: "주식", display: 20, sort: "date" },
      headers: {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
      },
    });

    const rawItems = response.data.items;
    const newItems = rawItems.filter((item) => !collectedLinks.has(item.link));
    newItems.forEach((item) => collectedLinks.add(item.link));

    const [thumbnails, crawledResults] = await Promise.all([
      Promise.all(newItems.map((item) => getThumbnail(item.link))),
      Promise.all(newItems.map((item) => getArticleTitleAndContent(item.link))),
    ]);

    const titles = crawledResults.map((r) => r.title);
    const contents = crawledResults.map((r) => r.content);

    let newsItems = mapKrxNews(newItems, thumbnails, contents, titles, crawledResults);
    newsItems = newsItems.filter((item) => item.content && item.content.trim().length > 0);

    const domesticAssets = (await findAllAssets()).filter(
      (asset) => asset.market === "KOSPI" || asset.market === "KOSDAQ",
    );
    const assetMap = new Map(
      domesticAssets.map((asset) => [asset.name.trim(), asset.symbol.trim()]),
    );

    for (const news of newsItems) {
      const tags: string[] = [];
      for (const [name, symbol] of assetMap.entries()) {
        if (
          typeof name === "string" &&
          (news.title.includes(name) || news.content.includes(name))
        ) {
          tags.push(symbol);
        }
      }
      if (tags.length === 0) continue;

      const analysis = await analyzeNews(news.title, news.content, news.published_at.toISOString());

      // ✅ 콘솔 로그만 출력
      console.log("🔍 GPT 분석 결과:", {
        title_ko: analysis.title_ko,
        summary: analysis.summary,
        brief: analysis.brief_summary,
        sentiment: analysis.news_sentiment,
        tags,
        긍정: analysis.news_positive,
        부정: analysis.news_negative,
      });

      // ❌ DB 저장 주석 처리
      /*
      const newsId = await createNewsWithAnalysis(news, {
        news_sentiment: analysis.news_sentiment,
        news_positive: JSON.stringify(analysis.news_positive),
        news_negative: JSON.stringify(analysis.news_negative),
        community_sentiment: null,
        summary: analysis.summary,
        brief_summary: analysis.brief_summary,
        tags: JSON.stringify(tags),
      }, analysis.title_ko);

      console.log(`✅ 저장 완료 | ID: ${newsId}`);
      */
      console.log(`📌 제목: ${news.title}`);
    }

    console.log("🎉 주식 뉴스 전체 수집 완료");
  } catch (err) {
    console.error("❌ 뉴스 수집 중 오류 발생:", err);
  }
};

const getArticleTitleAndContent = async (
  url: string,
): Promise<{ title: string; content: string }> => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      slowMo: 50,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1920x1080",
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    );
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    const result = await page.evaluate(() => {
      const title = document.querySelector("title")?.innerText || "";
      const article = document.querySelector("article") || document.body;
      const content = article?.innerText || "";
      return { title, content };
    });

    await browser.close();
    return {
      title: result.title.trim(),
      content: result.content.trim(),
    };
  } catch (error) {
    console.error("❌ Puppeteer 크롤링 오류:", error);
    return { title: "", content: "" };
  }
};

const getThumbnail = async (url: string): Promise<string | null> => {
  try {
    const res = await axios.get<string>(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(res.data);
    return $("meta[property='og:image']").attr("content") || null;
  } catch {
    console.warn(`⚠️ 썸네일 수집 실패: ${url}`);
    return null;
  }
};

export const startSmartKrxNewsScheduler = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ 스케줄러 실행 - 국내 뉴스 수집");
    await fetchAndProcessSmartKrxNews();
  });
};

// 서버 시작 시 자동 실행되는 뉴스 수집 코드를 주석 처리하여,
// 라우터 등에서 직접 접근할 때만 뉴스 수집이 실행되도록 함.
// fetchAndProcessSmartKrxNews();
