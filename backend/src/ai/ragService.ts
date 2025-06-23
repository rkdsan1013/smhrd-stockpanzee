// /backend/src/ai/ragService.ts
import { analyzeNews } from "./gptNewsAnalysis";

/**
 * RAG 기능에서 외부 임베딩이나 벡터 검색 없이,
 * 단순히 사용자 쿼리를 GPT 분석 함수에 전달하여 결과를 도출합니다.
 */
export async function generateRagResponse(userQuery: string): Promise<{
  summary: string;
  brief_summary: string;
  news_sentiment: number;
  news_positive: string[];
  news_negative: string[];
  tags: string[];
}> {
  // 사용자 쿼리를 뉴스 제목 및 내용으로써 사용합니다.
  const analysis = await analyzeNews(userQuery, userQuery, "");
  return {
    summary: analysis.summary,
    brief_summary: analysis.brief_summary,
    news_sentiment: analysis.news_sentiment,
    news_positive: analysis.news_positive,
    news_negative: analysis.news_negative,
    tags: analysis.tags,
  };
}
