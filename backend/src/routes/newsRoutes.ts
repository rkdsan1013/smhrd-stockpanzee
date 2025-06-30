// /backend/src/routes/newsRoutes.ts
import { Router } from "express";
import {
  getNews,
  getNewsDetail,
  testCryptoNewsProcessing,
  testKrxNewsProcessing,
  testUSStockNewsProcessing,
} from "../controllers/newsController";

const router = Router();

// 전체 또는 ?asset=XXX&exclude=ID 방식의 뉴스 목록 조회
router.get("/", getNews);

// 테스트: 암호화폐 뉴스 파이프라인 실행
// router.get("/test-crypto", testCryptoNewsProcessing);

// 테스트: KRX(국내) 뉴스 파이프라인 실행
// router.get("/test-krx", testKrxNewsProcessing);

// 테스트: US 주식 뉴스 파이프라인 실행
// router.get("/test-usstock", testUSStockNewsProcessing);

// 뉴스 상세 조회 (/:id)
router.get("/:id", getNewsDetail);

export default router;
