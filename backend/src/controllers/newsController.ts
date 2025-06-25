// /backend/src/controllers/newsController.ts
import { Request, Response } from "express";
import { fetchAndProcessOneStockNews } from "../services/news/usstockNewsService";
import { fetchAndProcessNews } from "../services/news/cryptoNewsService";
import { fetchAndProcessSmartKrxNews } from "../services/news/krxNewsService";
import { getAllNews } from "../models/newsTransactions";
import * as newsService from "../services/newsService";

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

// 테스트 뉴스 처리 2: 국내 스마트 KRX 뉴스 수집/분석/저장
export const testNewsProcessing2 = async (req: Request, res: Response) => {
  try {
    await fetchAndProcessSmartKrxNews();
    res.status(200).json({ message: "테스트 뉴스 처리 완료." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "뉴스 처리 중 오류 발생" });
  }
};

// 미국 뉴스 처리: 외부 미국 뉴스 수집/분석/저장
export const testStockNewsProcessing = async (req: Request, res: Response) => {
  try {
    await fetchAndProcessOneStockNews();
    res.status(200).json({ message: "국제 뉴스 처리 완료." });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "국제 뉴스 처리 중 오류 발생" });
  }
};


// 뉴스 상세보기 처리

export const getNewsDetail = async (req: Request, res: Response): Promise<void> => {
  const newsId = Number(req.params.id);
  if (isNaN(newsId)) {
    res.status(400).json({ error: "Invalid news id" });
    return;
  }
  try {
    const newsDetail = await newsService.getNewsDetailById(newsId);
    if (!newsDetail) {
      res.status(404).json({ error: "뉴스를 찾을 수 없습니다." });
      return;
    }
    res.json(newsDetail);
  } catch (err) {
    // ★ 반드시 에러 로그 콘솔에 남기기!
    console.error("[getNewsDetail 500]", err);  // ← 이게 꼭 찍혀야 해요!
    res.status(500).json({ error: "서버 오류" });
  }
};
