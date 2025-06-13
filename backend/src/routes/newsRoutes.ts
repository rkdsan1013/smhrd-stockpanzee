// /backend/src/routes/newsRoutes.ts
import { Router } from "express";
import { updateCryptoNews } from "../controllers/newsController";

const router = Router();

// 암호화폐 뉴스 업데이트 엔드포인트 (추후 국내/해외 뉴스 엔드포인트 추가 가능)
router.get("/update-crypto-news", updateCryptoNews);

export default router;
