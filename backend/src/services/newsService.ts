// /backend/services/newsService.ts
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


export async function getNewsDetailById(newsId: number) {
  const news = await newsModel.findNewsWithAnalysisById(newsId);
  if (!news) return null;
  let asset = null;
  if (news.asset_id) {
    asset = await assetModel.findAssetWithInfoById(news.asset_id);
  }
  return { ...news, asset };
}

