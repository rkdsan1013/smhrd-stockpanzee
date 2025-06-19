import { getChatbotResponse } from "../ai/gptChatbot";

export interface ChatbotRequest {
  question: string;
}

export interface ChatbotResponse {
  answer: string;
}

/**
 * 팬지봇 서비스: 사용자 질문을 넘겨 GPT 기반 응답을 생성합니다.
 *
 * @param payload 사용자 질문을 포함한 객체
 * @returns 팬지봇 응답이 담긴 객체
 */
export async function getChatbotAnswer(payload: ChatbotRequest): Promise<ChatbotResponse> {
  const answer = await getChatbotResponse(payload.question);
  return { answer };
}
