// /backend/src/controllers/newsController.ts
import { Request, Response, NextFunction } from "express";
import { fetchAndStoreCryptoNews } from "../services/news/cryptoNewsService";

/**
 * GET /api/news/update-crypto-news
 * 외부 암호화폐 뉴스 API 호출 및 DB 업데이트 후 성공 메시지 반환
 */
export const updateCryptoNews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await fetchAndStoreCryptoNews();
    res.json({ message: "암호화폐 뉴스 데이터가 성공적으로 업데이트되었습니다." });
  } catch (error) {
    next(error);
  }
};
