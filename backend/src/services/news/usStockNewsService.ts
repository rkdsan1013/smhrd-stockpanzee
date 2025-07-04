// /backend/src/services/news/usStockNewsService.ts
import { RowDataPacket } from "mysql2";
import pool from "../../config/db";
import { mapUsStockNews } from "../../utils/news/usStockNewsMapper";
import { extractFullContent } from "../../utils/news/newsContentExtractor";
import { findNewsByLink, createNewsWithAnalysis } from "../../models/newsTransactions";
import { analyzeNews, AnalysisResult } from "../../ai/gptNewsAnalysis";
import { findStockAssets } from "../../models/assetModel";
import { getEmbedding } from "../../ai/embeddingService";
import { upsertNewsVector, NewsVector } from "./storeNewsVector";

const ALPHAVANTAGE_API_KEY = process.env.ALPHAVANTAGE_API_KEY!;
const STOCK_NEWS_API_URL = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${ALPHAVANTAGE_API_KEY}`;

/** "YYYYMMDDThhmmss" → Date */
const parseTimePublished = (raw: string): Date => {
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/);
  if (!m) return new Date(NaN);
  const [, Y, Mo, Da, h, mi, s] = m;
  return new Date(`${Y}-${Mo}-${Da}T${h}:${mi}:${s}Z`);
};

export const fetchAndProcessUsStockNews = async (): Promise<void> => {
  try {
    // 1) NASDAQ/NYSE 심볼 조회
    const [rows] = await pool.query<RowDataPacket[] & { symbol: string }[]>(
      "SELECT symbol FROM assets WHERE market IN ('NASDAQ','NYSE')",
    );
    const validSymbols = new Set(rows.map((r) => r.symbol.toUpperCase()));

    console.log("US Stock 뉴스 수집 시작:", STOCK_NEWS_API_URL);
    const resp = await fetch(STOCK_NEWS_API_URL);
    if (!resp.ok) throw new Error(`뉴스 API 요청 실패: ${resp.status}`);
    const rawData = await resp.json();

    // 2) 매핑 & published_at 설정
    const newsItems = mapUsStockNews(rawData, validSymbols).map((item) => {
      const feed = rawData.feed.find((f: any) => f.url === item.news_link);
      item.published_at = parseTimePublished(feed?.time_published ?? "");
      return item;
    });
    console.log(`수집된 US 뉴스 개수: ${newsItems.length}`);

    // 3) 개별 뉴스 처리
    for (const news of newsItems) {
      // 3-1) 중복 체크
      if (await findNewsByLink(news.news_link)) {
        console.log(`이미 처리됨, 스킵: ${news.news_link}`);
        continue;
      }

      // 3-2) 전문 추출
      const fullContent = await extractFullContent(news.news_link);
      if (!fullContent) {
        console.warn(`본문 추출 실패, 스킵: ${news.news_link}`);
        continue;
      }
      news.content = fullContent;

      // 3-3) 게시일 문자열화
      const dt = news.published_at;
      const publishedStr = !isNaN(dt.getTime()) ? dt.toISOString() : "Invalid Date";

      // 3-4) GPT 뉴스 분석
      const analysis: AnalysisResult = await analyzeNews(news.title, news.content, publishedStr);

      // 3-5) success 플래그 검사
      if (!analysis.success) {
        console.log("❌ 관련 없는 뉴스(또는 광고)로 판단되어 스킵");
        continue;
      }
      console.log("✅ GPT 분석 완료:", {
        sentiment: analysis.news_sentiment,
        tags: analysis.tags,
      });

      // 3-6) optional 필드 기본값 처리
      const positives = analysis.news_positive || [];
      const negatives = analysis.news_negative || [];
      const tagsArr = analysis.tags || [];

      // 3-7) 종목 태그 필터링
      const stockAssets = await findStockAssets();
      const symbolSet = new Set(stockAssets.map((a) => a.symbol.toUpperCase()));
      const filteredTags = tagsArr.filter((t) => symbolSet.has(t.toUpperCase()));

      if (filteredTags.length === 0) {
        console.log("연관 종목 없음, 빈 태그로 저장합니다");
      }

      // 3-8) DB 저장 준비
      const preparedNews = {
        ...news,
        news_category: "international" as const,
        publisher: news.source_title,
      };

      const analysisData = {
        news_sentiment: analysis.news_sentiment!,
        news_positive: JSON.stringify(positives),
        news_negative: JSON.stringify(negatives),
        community_sentiment: 3,
        summary: analysis.summary!,
        brief_summary: analysis.brief_summary!,
        tags: JSON.stringify(filteredTags),
      };

      // 3-9) 뉴스 + 분석 DB 저장
      const newsId = await createNewsWithAnalysis(preparedNews, analysisData, analysis.title_ko!);
      console.log(`✅ DB 저장 완료 (ID=${newsId})`);

      // 3-10) 임베딩 생성 및 벡터 저장
      const vectorText = `${news.title} ${publishedStr} ${analysis.summary}`;
      const embedding = await getEmbedding(vectorText);
      const newsVector: NewsVector = {
        id: news.news_link,
        values: embedding,
        metadata: {
          published_at: publishedStr,
          title_ko: analysis.title_ko!,
          summary: analysis.summary!,
          news_link: news.news_link,
        },
      };
      await upsertNewsVector(newsVector);
      console.log("✅ 뉴스 임베딩 & 벡터 저장 완료");
      console.log("---------------------------------------------------");
    }

    console.log("🎉 모든 US Stock 뉴스 처리 완료");
  } catch (error: any) {
    console.error("US Stock 뉴스 처리 중 오류:", error);
    throw error;
  }
};
