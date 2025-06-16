// /backend/src/routes/newsRoutes.ts
import { Router } from "express";
import { testNewsProcessing, testStockNewsProcessing } from "../controllers/newsController";

const router = Router();

// "/api/news/test-news"에 GET 요청 시 테스트 뉴스 처리 함수가 실행됩니다.
router.get("/test-news", testNewsProcessing);

// ✅ Alpha Vantage 국제 뉴스 테스트용 경로 추가
router.get("/test-stock-news", testStockNewsProcessing);

export default router;
