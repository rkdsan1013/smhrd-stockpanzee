// /backend/src/ai/ragService.ts
import { getEmbedding } from "./embeddingService";
import vectorDB from "./vectorDB";
import { analyzeNews } from "./gptNewsAnalysis";

export async function generateRagResponse(userQuery: string): Promise<{
  summary: string;
  brief_summary: string;
  news_sentiment: number;
  news_positive: string[];
  news_negative: string[];
  tags: string[];
}> {
  // 1. 사용자 쿼리 임베딩 생성
  const queryEmbedding = await getEmbedding(userQuery);

  // 2. 벡터 DB에서 유사 뉴스 검색 (임계값 0.75 이상, 최대 2개)
  const similarItems = vectorDB.findSimilar(queryEmbedding, 0.75).slice(0, 2);

  // 3. 검색된 뉴스 메타 정보를 기반으로 컨텍스트 텍스트 생성
  const contextText = similarItems
    .map((item) => `뉴스 ID: ${item.newsId}, 제목: ${item.meta?.title || "제목 없음"}`)
    .join("\n");

  // 4. 사용자 쿼리와 컨텍스트를 포함하여 동일한 말투로 구성
  const newsTitleForRag = `사용자 쿼리: ${userQuery}`;
  const newsContentForRag = `아래는 관련 뉴스 정보입니다:\n${contextText}`;

  // analyzeNews 함수는 뉴스 제목과 뉴스 내용을 기반으로 분석 결과를 반환합니다.
  const analysis = await analyzeNews(newsTitleForRag, newsContentForRag);
  return {
    summary: analysis.summary,
    brief_summary: analysis.brief_summary,
    news_sentiment: analysis.news_sentiment,
    news_positive: analysis.news_positive,
    news_negative: analysis.news_negative,
    tags: analysis.tags,
  };
}
