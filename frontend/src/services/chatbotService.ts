// /frontend/src/services/chatbotService.ts
import { post } from "./apiClient";

export interface ChatbotRequest {
  question: string;
}
export interface ChatbotResponse {
  answer: string;
}

/**
 * 팬지봇 응답 받아오기
 * - 로컬스토리지 체크 제거
 * - withCredentials:true 이므로 HttpOnly 쿠키로 인증
 */
export const getChatbotAnswer = async (payload: ChatbotRequest): Promise<ChatbotResponse> => {
  return post<ChatbotResponse>("/chatbot", payload);
};
