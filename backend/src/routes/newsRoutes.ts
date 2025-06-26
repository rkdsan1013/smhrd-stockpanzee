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

// 전체 또는 ?asset=XXX&exclude=ID 방식의 뉴스 목록 조회
router.get("/", getNews);

// 테스트: 암호화폐 뉴스 파이프라인 실행
router.get("/test-news", testNewsProcessing);

// 테스트: KRX 뉴스 파이프라인 실행
router.get("/test-news2", testNewsProcessing2);

// 테스트: 해외주식 뉴스 파이프라인 실행
router.get("/test-stock-news", testStockNewsProcessing);

// 뉴스 상세 조회 (/:id)
router.get("/:id", getNewsDetail);

export default router;
