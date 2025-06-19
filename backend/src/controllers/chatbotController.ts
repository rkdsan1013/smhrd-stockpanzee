import { Request, Response, NextFunction } from "express";
import { getChatbotAnswer, ChatbotRequest, ChatbotResponse } from "../services/chatbotService";

export async function chatbotController(req: Request, res: Response, next: NextFunction) {
  try {
    const payload: ChatbotRequest = req.body;
    const result: ChatbotResponse = await getChatbotAnswer(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
