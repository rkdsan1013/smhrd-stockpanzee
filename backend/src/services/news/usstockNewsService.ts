// /backend/src/services/news/usstockNewsService.ts
import pool from "../../config/db";
import { mapStockNews } from "../../utils/news/usstockNewsMapper";
import { extractFullContent } from "../../utils/news/newsContentExtractor";
import { findNewsByLink, createNewsWithAnalysis } from "../../../src/models/newsTransactions";
import { analyzeNews } from "../../../src/ai/gptNewsAnalysis";
import { findStockAssets } from "../../../src/models/assetModel";
import { getEmbedding } from "../../../src/ai/embeddingService";
import { upsertNewsVector, NewsVector } from "./storeNewsVector";

const ALPHAVANTAGE_API_KEY = process.env.ALPHAVANTAGE_API_KEY!;
const STOCK_NEWS_API_URL = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${ALPHAVANTAGE_API_KEY}`;

/** "YYYYMMDDThhmmss" → Date */
const parseTimePublished = (raw: string): Date => {
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (!m) return new Date(NaN);
  const [, Y, M, D, h, mnt, s] = m;
  return new Date(`${Y}-${M}-${D}T${h}:${mnt}:${s}Z`);
};

export const fetchAndProcessOneStockNews = async (): Promise<void> => {
  try {
    // 1) NASDAQ/NYSE 심볼 조회
    const [rows] = await pool.query("SELECT symbol FROM assets WHERE market IN ('NASDAQ','NYSE')");
    const validSymbols = new Set((rows as any[]).map((r) => r.symbol.toUpperCase()));

    console.log("US Stock 뉴스 수집 시작:", STOCK_NEWS_API_URL);
    const response = await fetch(STOCK_NEWS_API_URL);
    if (!response.ok) throw new Error(`뉴스 API 요청 실패: ${response.status}`);
    const rawData = await response.json();

    // 2) 매핑 & published_at 설정
    const newsItems = mapStockNews(rawData, validSymbols).map((item) => {
      const feed = rawData.feed.find((f: any) => f.url === item.news_link);
      item.published_at = parseTimePublished(feed?.time_published ?? "");
      return item;
    });

    console.log(`수집된 US 뉴스 개수: ${newsItems.length}`);

    for (const news of newsItems) {
      // 3) 중복 체크
      if (await findNewsByLink(news.news_link)) {
        console.log(`이미 처리된 뉴스, 스킵: ${news.news_link}`);
        continue;
      }

      // 4) extractFullContent로 전문 추출
      const fullContent = await extractFullContent(news.news_link);
      if (!fullContent) {
        console.warn(`본문 추출 실패, 스킵: ${news.news_link}`);
        continue;
      }
      news.content = fullContent;

      // 5) 날짜 문자열화
      const dt = news.published_at;
      const publishedStr = !isNaN(dt.getTime()) ? dt.toISOString() : "Invalid Date";

      // 6) GPT로 뉴스 분석
      const analysis = await analyzeNews(news.title, news.content, publishedStr);
      console.log("GPT 분석 결과:", analysis);

      // 7) 자산 심볼 태그 필터링
      const assets = await findStockAssets();
      const symbols = new Set(assets.map((a) => a.symbol.toUpperCase()));
      const filteredTags = analysis.tags.filter((t: string) => symbols.has(t.toUpperCase()));

      // 8) DB 저장 준비
      const preparedNews = {
        ...news,
        news_category: "international" as const,
        publisher: news.source_title,
      };
      const newsId = await createNewsWithAnalysis(
        preparedNews,
        {
          news_sentiment: analysis.news_sentiment,
          news_positive: JSON.stringify(analysis.news_positive),
          news_negative: JSON.stringify(analysis.news_negative),
          community_sentiment: 3,
          summary: analysis.summary,
          brief_summary: analysis.brief_summary,
          tags: JSON.stringify(filteredTags),
        },
        analysis.title_ko,
      );
      console.log(`뉴스 DB 및 분석 저장 완료: ID=${newsId}`);

      // 9) 임베딩 생성 및 벡터 저장
      const vectorText = `${news.title} ${publishedStr} ${analysis.summary}`;
      const embedding = await getEmbedding(vectorText);
      const newsVector: NewsVector = {
        id: news.news_link,
        values: embedding,
        metadata: {
          published_at: publishedStr,
          title_ko: analysis.title_ko,
          summary: analysis.summary,
          news_link: news.news_link,
        },
      };
      await upsertNewsVector(newsVector);
      console.log("뉴스 임베딩 & 벡터 저장 완료.");
      console.log("---------------------------------------------------");
    }

    console.log("모든 US Stock 뉴스 처리 완료.");
  } catch (error) {
    console.error("US Stock 뉴스 처리 중 오류:", error);
    throw error;
  }
};
