// /backend/src/routes/chatbotRoutes.ts
import { Router } from "express";
import { authenticate } from "../middlewares/auth"; // ← 인증 미들웨어
import { chatbotController } from "../controllers/chatbotController";

const router = Router();

// POST /api/chatbot : 로그인된 사용자만
router.post("/", authenticate, chatbotController);

export default router;
