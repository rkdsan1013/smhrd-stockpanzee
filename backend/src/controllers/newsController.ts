// /backend/src/controllers/newsController.ts
import { Request, Response } from "express";
import { fetchAndProcessNews } from "../services/news/cryptoNewsService";
import { fetchAndProcessSmartKrxNews} from "../services/news/krxNewsService";
import { getAllNews } from "../models/newsTransactions";

// 뉴스 목록 조회: 뉴스와 뉴스 분석 데이터를 LEFT JOIN하여 반환
export const getNews = async (req: Request, res: Response) => {
  try {
    const news = await getAllNews();
    res.status(200).json(news);
  } catch (error: any) {
    console.error("뉴스 조회 중 오류 발생:", error);
    res.status(500).json({ error: error.message || "뉴스 조회 중 오류 발생" });
  }
};

// 테스트 뉴스 처리: 외부 뉴스 수집 및 분석 전체 파이프라인 실행
export const testNewsProcessing = async (req: Request, res: Response) => {
  try {
    await fetchAndProcessNews();
    res.status(200).json({ message: "모든 뉴스 처리 완료." });
  } catch (error: any) {
    console.error("뉴스 처리 중 오류 발생:", error);
    res.status(500).json({ error: error.message || "뉴스 처리 중 오류 발생" });
  }
};

export const testNewsProcessing2 = async (req: Request, res: Response) => {
  try {
    await fetchAndProcessSmartKrxNews();
    res.status(200).json({ message: "테스트 뉴스 처리 완료." });
  } catch (error) {
    res.status(500).json({ error: "뉴스 처리 중 오류 발생" });
  }
};
