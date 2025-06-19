import { getEmbedding } from "./embeddingService";
import { searchNewsVectorsLocal } from "./vectorDB";
import { getChatbotResponse } from "./gptChatbot"; // 기존 GPT 챗봇 호출 함수

/**
 * 사용자의 질문에 대해, 임베딩을 활용하여 로컬 벡터 DB에서 유사한 뉴스를 검색하고,
 * 검색된 뉴스 컨텍스트 및 오늘의 날짜 정보를 포함한 프롬프트를 구성하여 GPT 기반 챗봇 응답을 생성합니다.
 *
 * @param userQuery - 사용자 질문
 * @returns GPT 기반 챗봇 응답 문자열
 */
export async function generateRagChatbotResponse(userQuery: string): Promise<string> {
  // 1. 사용자 질문 임베딩 계산
  const queryEmbedding = await getEmbedding(userQuery);

  // 2. 로컬 벡터 DB에서 유사 뉴스 검색 (상위 3건)
  const similarNews = await searchNewsVectorsLocal(queryEmbedding, 3);

  // 3. 검색된 뉴스 정보를 컨텍스트 문자열로 구성 (게시일은 읽기 쉬운 형식으로 변환)
  let context = "유사 뉴스 컨텍스트:\n";
  similarNews.forEach((newsVector) => {
    const publishedDate = new Date(newsVector.metadata.published_at);
    const publishedDateFormatted = publishedDate.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    context += `제목: ${newsVector.metadata.title_ko}\n게시일: ${publishedDateFormatted}\n요약: ${newsVector.metadata.summary}\n\n`;
  });

  // 4. 오늘 날짜를 포맷팅 ("YYYY년 M월 D일")
  const today = new Date();
  const todayStr = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 5. 프롬프트 최종 구성: 뉴스 컨텍스트, 오늘 날짜, 사용자 질문 포함
  const combinedPrompt = `${context}\n오늘 날짜: ${todayStr}\n사용자 질문: ${userQuery}\n위 컨텍스트를 참고하여 상세하고 정확한 답변을 제공해주세요.`;

  console.log("RAG 프롬프트:", combinedPrompt);

  // 6. GPT 챗봇 API 호출하여 최종 응답 생성
  const answer = await getChatbotResponse(combinedPrompt);
  return answer;
}
