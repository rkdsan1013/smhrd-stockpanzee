// /backend/src/controllers/newsController.ts
import { RequestHandler } from "express";
import { getAllNews } from "../models/newsTransactions";
import * as newsService from "../services/newsService";

import { fetchAndProcessCryptoNews } from "../services/news/cryptoNewsService";
import { fetchAndProcessKrxNews } from "../services/news/krxNewsService";
import { fetchAndProcessUsStockNews } from "../services/news/usStockNewsService";

// GET /api/news
export const getNews: RequestHandler = async (req, res) => {
  const { asset, exclude } = req.query;
  try {
    if (asset) {
      const list = await newsService.getNewsByAsset(
        String(asset),
        exclude ? Number(exclude) : undefined,
      );
      res.status(200).json(list);
      return;
    }
    const all = await newsService.getAllNews();

    res.status(200).json(all);
  } catch (err: any) {
    console.error("뉴스 조회 중 오류:", err);
    res.status(500).json({ error: err.message || "서버 오류" });
  }
};

// GET /api/news/:id
export const getNewsDetail: RequestHandler = async (req, res) => {
  const newsId = Number(req.params.id);
  if (isNaN(newsId)) {
    res.status(400).json({ error: "잘못된 뉴스 ID" });
    return;
  }

  try {
    const detail = await newsService.getNewsDetailById(newsId);
    if (!detail) {
      res.status(404).json({ error: "뉴스를 찾을 수 없습니다." });
      return;
    }
    res.status(200).json(detail);
  } catch (err: any) {
    console.error("뉴스 상세 조회 중 오류:", err);
    res.status(500).json({ error: "서버 오류" });
  }
};

// GET /api/news/test-crypto
export const testCryptoNewsProcessing: RequestHandler = async (req, res) => {
  try {
    await fetchAndProcessCryptoNews();
    res.status(200).json({ ok: true, message: "암호화폐 뉴스 처리 완료." });
  } catch (err: any) {
    console.error("암호화폐 뉴스 처리 중 오류:", err);
    res.status(500).json({ error: err.message || "서버 오류" });
  }
};

// GET /api/news/test-krx
export const testKrxNewsProcessing: RequestHandler = async (req, res) => {
  try {
    await fetchAndProcessKrxNews();
    res.status(200).json({ ok: true, message: "국내(KRX) 뉴스 처리 완료." });
  } catch (err: any) {
    console.error("국내(KRX) 뉴스 처리 중 오류:", err);
    res.status(500).json({ error: err.message || "서버 오류" });
  }
};

// GET /api/news/test-usstock
export const testUSStockNewsProcessing: RequestHandler = async (req, res) => {
  try {
    await fetchAndProcessUsStockNews();
    res.status(200).json({ ok: true, message: "해외주식(US) 뉴스 처리 완료." });
  } catch (err: any) {
    console.error("해외주식(US) 뉴스 처리 중 오류:", err);
    res.status(500).json({ error: err.message || "서버 오류" });
  }
};
