// /frontend/src/services/chatbotService.tsx
import { post } from "./apiClient";

// 챗봇 요청에 전달할 페이로드 타입
export interface ChatbotRequest {
  question: string;
}

// 챗봇 응답의 타입 – 백엔드가 { answer: string } 형식으로 응답한다고 가정합니다.
export interface ChatbotResponse {
  answer: string;
}

/**
 * 팬지봇 응답을 받아오는 서비스 함수입니다.
 *
 * @param payload - 사용자의 질문을 포함하는 객체 ({ question: string })
 * @returns 팬지봇 응답이 포함된 객체 ({ answer: string })
 */
export const getChatbotAnswer = async (payload: ChatbotRequest): Promise<ChatbotResponse> => {
  // post 함수는 앞서 구성한 axiosInstance를 사용하여 요청합니다.
  return post<ChatbotResponse>("/chatbot", payload);
};
