// /backend/src/ai/ragService.ts
import { getEmbedding } from "./embeddingService";
import vectorDB from "./vectorDB";
import { analyzeNews } from "./gptNewsAnalysis";

export async function generateRagResponse(userQuery: string): Promise<string> {
  // 1. 사용자 쿼리 임베딩 생성
  const queryEmbedding = await getEmbedding(userQuery);

  // 2. 벡터 DB에서 유사 뉴스 검색 (임계값 0.75 이상)
  // 그리고 최대 2개까지만 사용하도록 slice 처리
  const similarItems = vectorDB.findSimilar(queryEmbedding, 0.75).slice(0, 2);

  // 3. 검색된 뉴스 메타 정보를 조합하여 컨텍스트 텍스트 생성
  const contextText = similarItems
    .map((item) => `뉴스 ID: ${item.newsId}, 제목: ${item.meta?.title || "제목 없음"}`)
    .join("\n");

  // 4. 사용자 쿼리와 컨텍스트를 포함한 프롬프트 전송
  const prompt = `사용자 쿼리: ${userQuery}
아래는 관련 뉴스 정보입니다:
${contextText}
이 정보를 바탕으로 상세한 답변을 작성해줘.`;

  const analysis = await analyzeNews(prompt);
  return analysis.summary;
}
