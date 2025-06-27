// /backend/src/controllers/newsController.ts
import { RequestHandler } from "express";
import { fetchAndProcessNews } from "../services/news/cryptoNewsService";
import { fetchAndProcessOneStockNews } from "../services/news/usStockNewsService";
import { fetchAndProcessSmartKrxNews } from "../services/news/krxNewsService";
import { getAllNews } from "../models/newsTransactions";
import * as newsService from "../services/newsService";

// GET /api/news
export const getNews: RequestHandler = async (req, res, next) => {
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
    const all = await getAllNews();
    res.status(200).json(all);
  } catch (err: any) {
    console.error("뉴스 조회 중 오류:", err);
    res.status(500).json({ error: err.message || "서버 오류" });
  }
};

// GET /api/news/:id
export const getNewsDetail: RequestHandler = async (req, res, next) => {
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

// GET /api/news/test-news
export const testNewsProcessing: RequestHandler = async (req, res, next) => {
  try {
    await fetchAndProcessNews();
    res.status(200).json({ ok: true, message: "암호화폐 뉴스 처리 완료." });
  } catch (err: any) {
    console.error("암호화폐 뉴스 처리 중 오류:", err);
    res.status(500).json({ error: err.message || "서버 오류" });
  }
};

// GET /api/news/test-news2
export const testNewsProcessing2: RequestHandler = async (req, res, next) => {
  try {
    await fetchAndProcessSmartKrxNews();
    res.status(200).json({ ok: true, message: "KRX 뉴스 처리 완료." });
  } catch (err: any) {
    console.error("KRX 뉴스 처리 중 오류:", err);
    res.status(500).json({ error: err.message || "서버 오류" });
  }
};

// GET /api/news/test-stock-news
export const testStockNewsProcessing: RequestHandler = async (req, res, next) => {
  try {
    await fetchAndProcessOneStockNews();
    res.status(200).json({ ok: true, message: "해외주식 뉴스 처리 완료." });
  } catch (err: any) {
    console.error("해외주식 뉴스 처리 중 오류:", err);
    res.status(500).json({ error: err.message || "서버 오류" });
  }
};
