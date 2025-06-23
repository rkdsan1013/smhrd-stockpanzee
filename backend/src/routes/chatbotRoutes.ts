// /backend/src/routes/chatbotRoutes.ts
import { Router } from "express";
import { chatbotController } from "../controllers/chatbotController";

const router = Router();

// POST /api/chatbot 엔드포인트를 통해 팬지봇 응답을 요청합니다.
router.post("/", chatbotController);

export default router;
