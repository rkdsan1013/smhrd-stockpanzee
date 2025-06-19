// /backend/src/services/chatbotService.ts
import { generateRagChatbotResponse } from "../ai/ragChatbotService";

export interface ChatbotRequest {
  question: string;
}

export interface ChatbotResponse {
  answer: string;
}

export async function getChatbotAnswer(payload: ChatbotRequest): Promise<ChatbotResponse> {
  const answer = await generateRagChatbotResponse(payload.question);
  return { answer };
}
