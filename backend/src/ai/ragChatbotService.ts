// /backend/src/ai/ragChatbotService.ts
import { getEmbedding } from "./embeddingService";
import { searchSimilarNews, ScoredVector } from "../repositories/vectorRepo";
import { getChatbotResponse } from "./gptChatbot";

const SIMILARITY_THRESHOLD = 0.25;

export async function generateRagChatbotResponse(userQuery: string): Promise<string> {
  // 1. 쿼리 임베딩 생성
  const queryVec = await getEmbedding(userQuery);

  // 2. pgvector DB에서 검색 (점수 포함)
  const raw: ScoredVector[] = await searchSimilarNews(queryVec, 10);

  // 3. 임계값 필터링 후 상위 3개 선택
  const hits = raw.filter((r) => r.score >= SIMILARITY_THRESHOLD).slice(0, 3);

  // 4. 컨텍스트 구성
  let context = "유사 뉴스 컨텍스트:\n";
  if (hits.length) {
    hits.forEach(({ newsVector }) => {
      const pub = new Date(newsVector.metadata.published_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      context += `제목: ${newsVector.metadata.title_ko}\n`;
      context += `게시일: ${pub}\n`;
      context += `요약: ${newsVector.metadata.summary}\n\n`;
    });
  } else {
    context += "(관련 컨텍스트 없음)\n\n";
  }

  // 5. 오늘 날짜
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 6. 최종 프롬프트 작성
  const prompt =
    `${context}` +
    `규칙: 컨텍스트가 질문과 관련성이 낮거나 없으면 "자료가 부족합니다."라고만 한국어로 답하십시오.\n\n` +
    `오늘 날짜: ${today}\n` +
    `사용자 질문: ${userQuery}\n` +
    `관련성이 높다면 간결하고 직설적으로 답하십시오.`;

  console.log("RAG PROMPT ===\n", prompt);

  // 7. GPT 호출
  return getChatbotResponse(prompt);
}
