// /backend/src/controllers/newsController.ts
import { Request, Response } from "express";
import { fetchAndProcessOneNews } from "../services/news/cryptoNewsService";
import { fetchAndProcessOneStockNews } from "../services/news/usstockNewsService";

export const testNewsProcessing = async (req: Request, res: Response) => {
  try {
    await fetchAndProcessOneNews();
    res.status(200).json({ message: "테스트 뉴스 처리 완료." });
  } catch (error) {
    res.status(500).json({ error: "뉴스 처리 중 오류 발생" });
  }
};

// 미국 뉴스
export const testStockNewsProcessing = async (req: Request, res: Response) => {
  try {
    await fetchAndProcessOneStockNews();
    res.status(200).json({ message: "국제 뉴스 처리 완료." });
  } catch (error) {
    res.status(500).json({ error: "국제 뉴스 처리 중 오류 발생" });
  }
};
