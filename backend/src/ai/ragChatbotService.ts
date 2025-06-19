// /backend/src/ai/ragChatbotService.ts
import { getEmbedding } from "./embeddingService";
import { searchNewsVectorsLocal, ScoredVector } from "./vectorDB";
import { getChatbotResponse } from "./gptChatbot";

const SIMILARITY_THRESHOLD = 0.25; // 높을수록 엄격

export async function generateRagChatbotResponse(userQuery: string): Promise<string> {
  /* 1. 쿼리 임베딩 */
  const queryVec = await getEmbedding(userQuery);

  /* 2. 벡터 DB 검색 (점수 포함) */
  const raw: ScoredVector[] = await searchNewsVectorsLocal(queryVec, 10);

  /* 3. 임계값 필터 */
  const hits = raw.filter((r) => r.score >= SIMILARITY_THRESHOLD).slice(0, 3);

  /* 4. 컨텍스트: 헤더는 항상 포함 */
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
    context += "(관련 컨텍스트 없음)\n\n"; // ← GPT가 반드시 감지
  }

  /* 5. 오늘 날짜 */
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  /* 6. 최종 프롬프트 */
  const prompt =
    `${context}` +
    `규칙: 컨텍스트가 질문과 관련성이 낮거나 없으면 "자료가 부족합니다."라고만 한국어로 답하십시오.\n\n` +
    `오늘 날짜: ${today}\n` +
    `사용자 질문: ${userQuery}\n` +
    `관련성이 높다면 간결하고 직설적으로 답하십시오.`;

  console.log("RAG PROMPT ===\n", prompt);

  /* 7. GPT 호출 */
  return getChatbotResponse(prompt);
}
