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

export interface NewsDetail {
  id: number;
  title_ko: string;
  news_category: string;
  thumbnail: string;
  news_link: string;
  publisher: string;
  published_at: string;
  summary: string;
  news_positive: string;
  news_negative: string;
  community_sentiment: string;
  news_sentiment: number;
  tags: string[]; // 배열 파싱
  assets_symbol?: string;
  assets_market?: string;
  assets_name?: string;
}

// 상세조회 (ID)
export async function getNewsDetailById(newsId: number) {
  const news = await newsModel.findNewsWithAnalysisById(newsId);
  if (!news) return null;

  // 자산 정보 붙이기
  let asset = null;
  if (news.asset_id) {
    asset = await assetModel.findAssetWithInfoById(news.asset_id);
  }

  // tags 문자열 → 배열로 변환
  const tagsArr: string[] = [];
  try {
    const parsed = JSON.parse(news.tags);
    if (Array.isArray(parsed)) tagsArr.push(...parsed);
  } catch {}

  return {
    ...news,
    tags: tagsArr,
    asset,
  };
}

// 종목(Symbol) 기반 리스트
export async function getNewsByAsset(assetSymbol: string, excludeId?: number) {
  return await newsModel.findNewsByAsset(assetSymbol, excludeId);
}
