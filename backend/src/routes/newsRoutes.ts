// /backend/src/routes/newsRoutes.ts
import { Router } from "express";
import {
  getNews,
  getNewsDetail,
  testNewsProcessing,
  testNewsProcessing2,
  testStockNewsProcessing,
} from "../controllers/newsController";

const router = Router();

// 뉴스 목록 조회: GET /api/news (뉴스와 분석 데이터를 조인하여 반환)
router.get("/", getNews);

// 테스트 뉴스 처리: 뉴스 수집/분석/저장을 실행 (GET /api/news/test-news)
router.get("/test-news", testNewsProcessing);
router.get("/test-news2", testNewsProcessing2);

// ✅ Alpha Vantage 국제 뉴스 테스트용 경로 추가
router.get("/test-stock-news", testStockNewsProcessing);


// 뉴스 상세 조회
router.get("/:id", getNewsDetail);


export default router;
