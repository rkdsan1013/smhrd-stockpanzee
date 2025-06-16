// /backend/src/routes/newsRoutes.ts
import { Router } from "express";
import { testNewsProcessing } from "../controllers/newsController";

const router = Router();

// "/api/news/test-news"에 GET 요청 시 테스트 뉴스 처리 함수가 실행됩니다.
router.get("/test-news", testNewsProcessing);

export default router;
