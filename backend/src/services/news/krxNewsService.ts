// /backend/src/services/news/krxNewsService.ts

import axios from "axios";
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import cron from "node-cron";

import { mapKrxNews, INews, NaverNewsApiItem } from "../../utils/news/krxNewsMapper";
import { analyzeNews } from "../../../src/ai/gptNewsAnalysis";
import { getRefinedNewsAnalysis } from "../../../src/ai/refinedNewsAnalysis";
import { findNewsByLink, createNewsWithAnalysis } from "../../../src/models/newsTransactions";
import { findCryptoAssets } from "../../../src/models/assetModel";

const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const NAVER_API_URL = "https://openapi.naver.com/v1/search/news.json";

// 🧠 국내 뉴스 수집 → 분석 → 저장
export const fetchAndProcessSmartKrxNews = async (): Promise<void> => {
  try {
    console.log("📢 국내 뉴스 수집 시작");

    const response = await axios.get<{ items: NaverNewsApiItem[] }>(NAVER_API_URL, {
      params: { query: "주식", display: 20, sort: "date" },
      headers: {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
      },
    });

    const rawItems = response.data.items;

    const [thumbnails, crawledResults] = await Promise.all([
      Promise.all(rawItems.map((item) => getThumbnail(item.link))),
      Promise.all(rawItems.map((item) => getArticleTitleAndContent(item.link))),
    ]);

    const titles = crawledResults.map((r) => r.title);
    const contents = crawledResults.map((r) => r.content);

    let newsItems = mapKrxNews(rawItems, thumbnails, contents, titles, crawledResults);

    newsItems = newsItems.filter((item) => item.content && item.content.trim().length > 0);

    const seen = new Set<string>();
    newsItems = newsItems.filter((item) => {
      const key = `${item.title}|${item.news_link}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    for (const news of newsItems) {
      const exists = await findNewsByLink(news.news_link);
      if (exists) {
        console.log(`🚫 중복 뉴스 스킵: ${news.news_link}`);
        continue;
      }

      const preparedNews: INews = {
        ...news,
        news_category: "domestic",
      };

      const publishedDateStr =
        news.published_at instanceof Date ? news.published_at.toISOString() : news.published_at;

      // GPT 초기 분석
      const initialAnalysis = await analyzeNews(news.title, news.content, publishedDateStr);
      // GPT Refined 분석
      const refinedAnalysis = await getRefinedNewsAnalysis(news.title, news.content, initialAnalysis);

      // 종목 태그 필터링
      const cryptoAssets = await findCryptoAssets();
      const cryptoSymbols = new Set(cryptoAssets.map((asset) => asset.symbol.toUpperCase()));
      const filteredTags = refinedAnalysis.tags.filter((tag) =>
        cryptoSymbols.has(tag.toUpperCase())
      );

      const analysisData = {
        news_sentiment: refinedAnalysis.news_sentiment,
        news_positive: JSON.stringify(refinedAnalysis.news_positive),
        news_negative: JSON.stringify(refinedAnalysis.news_negative),
        community_sentiment: refinedAnalysis.community_sentiment,
        summary: refinedAnalysis.summary,
        brief_summary: refinedAnalysis.brief_summary,
        tags: JSON.stringify(filteredTags),
      };

      const newsId = await createNewsWithAnalysis(preparedNews, analysisData, initialAnalysis.title_ko);

      console.log(`✅ 저장 완료 | ID: ${newsId}`);
      console.log(`📌 요약: ${refinedAnalysis.brief_summary}`);
      console.log(`📌 제목: ${initialAnalysis.title_ko}`);
    }

    console.log("🎉 국내 뉴스 전체 수집 완료");
  } catch (err) {
    console.error("❌ 뉴스 처리 오류:", err);
    throw err;
  }
};

// 크롤링 함수
const getArticleTitleAndContent = async (
  url: string
): Promise<{ title: string; content: string }> => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      slowMo: 50,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 Chrome/120 Safari/537.36");
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

// 썸네일 크롤링 함수
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

// 스케줄러 등록
export const startSmartKrxNewsScheduler = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ 스케줄러 실행 - 국내 뉴스 수집");
    await fetchAndProcessSmartKrxNews();
  });
};

// 직접 실행
fetchAndProcessSmartKrxNews();
