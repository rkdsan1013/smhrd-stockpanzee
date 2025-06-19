import { Request, Response, NextFunction } from "express";
import { getChatbotAnswer, ChatbotRequest, ChatbotResponse } from "../services/chatbotService";

/**
 * 팬지봇 컨트롤러: 요청으로 전달된 사용자 질문에 대해 팬지봇 응답을 반환합니다.
 */
export async function chatbotController(req: Request, res: Response, next: NextFunction) {
  try {
    const payload: ChatbotRequest = req.body; // { question: string }
    const result: ChatbotResponse = await getChatbotAnswer(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
