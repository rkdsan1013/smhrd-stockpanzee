// /backend/src/services/news/usstockNewsService.ts
import pool from "../../config/db";
import { mapStockNews, IStockNews } from "../../utils/news/usstockNewsMapper";
import { findNewsByLink } from "../../models/newsTransactions";
import { extractFullContentWithPuppeteer } from "../../utils/crawler/usnewsContentCrawler";
import dotenv from "dotenv";
dotenv.config();

const ALPHAVANTAGE_API_KEY = process.env.ALPHAVANTAGE_API_KEY;
const STOCK_NEWS_API_URL = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${ALPHAVANTAGE_API_KEY}`;

// ✅ 서비스 내부에 날짜 변환 함수 정의
const parseTimePublished = (raw: string): Date => {
  const match = raw?.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (!match) return new Date(NaN);
  const [, year, month, day, hour, minute, second] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
};

export const fetchAndProcessOneStockNews = async (): Promise<void> => {
  try {
    const [rows] = await pool.query(
      "SELECT symbol FROM assets WHERE market = 'NASDAQ' OR market = 'NYSE'",
    );
    const validSymbols = new Set((rows as any[]).map((row) => row.symbol));

    console.log("Alpha Vantage 뉴스 수집 시작:", STOCK_NEWS_API_URL);
    const response = await fetch(STOCK_NEWS_API_URL);
    if (!response.ok) throw new Error(`뉴스 API 요청 실패: ${response.status}`);

    const rawData = await response.json();
    const mappedNews = mapStockNews(rawData, validSymbols);

    // ✅ published_at 값을 수동으로 덮어쓰기
    for (const item of mappedNews) {
      const rawFeedItem = rawData.feed.find((f: any) => f.url === item.news_link);
      item.published_at = parseTimePublished(rawFeedItem?.time_published ?? "");
    }

    console.log(`심볼 필터링 후 뉴스 개수: ${mappedNews.length}`);
    const testNewsItems = mappedNews.slice(0, 1);

    for (let i = 0; i < testNewsItems.length; i++) {
      const news = testNewsItems[i];
      const exists = await findNewsByLink(news.news_link);
      if (exists) continue;

      const fullContent = await extractFullContentWithPuppeteer(news.news_link);
      if (!fullContent) continue;

      news.content = fullContent;

      const isValidDate = (d: Date) => !isNaN(d.getTime());
      const publishedStr = isValidDate(news.published_at)
        ? news.published_at.toISOString()
        : "유효하지 않은 날짜";

      console.log(`\n---------------------- [뉴스 ${i + 1}] ----------------------`);
      console.log(`타이틀     : ${news.title}`);
      console.log(`내용       :\n${fullContent}`);
      console.log(`뉴스 링크  : ${news.news_link}`);
      console.log(`썸네일     : ${news.thumbnail}`);
      console.log(`게시일     : ${publishedStr}`);
      console.log(`출처 타이틀: ${news.source_title}`);
      console.log(`📦 원본 JSON 전체:\n${JSON.stringify(news, null, 2)}`);
    }
  } catch (error) {
    console.error("Alpha Vantage 뉴스 처리 중 오류:", error);
  }
};
