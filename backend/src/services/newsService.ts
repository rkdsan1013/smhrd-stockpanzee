// /backend/src/services/newsService.ts
import * as newsModel from "../models/newsModel";
import * as assetModel from "../models/assetModel";

export interface NewsItem {
  id: number;
  title: string;
  title_ko?: string;
  image: string;
  category: "domestic" | "international" | "crypto";
  sentiment: number;
  summary: string;
  brief_summary: string;
  tags: string; // JSON 문자열
  published_at: string;
  publisher: string;
}

// 뉴스 상세 조회 (ID 기반)
export async function getNewsDetailById(newsId: number) {
  const news = await newsModel.findNewsWithAnalysisById(newsId);
  if (!news) return null;
  let asset = null;
  if (news.asset_id) {
    asset = await assetModel.findAssetWithInfoById(news.asset_id);
  }
  return { ...news, asset };
}

// 종목(Symbol) 기반으로 매칭된 뉴스 리스트 조회
export async function getNewsByAsset(assetSymbol: string, excludeId?: number) {
  return await newsModel.findNewsByAsset(assetSymbol, excludeId);
}
