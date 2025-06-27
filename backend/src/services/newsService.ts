// backend/src/services/newsService.ts

import * as newsModel from "../models/newsModel";

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
  tags: string[]; // 파싱된 배열
  assets_symbol?: string;
  assets_market?: string;
  assets_name?: string;
}

/**
 * 뉴스 상세 조회 (ID)
 */
export async function getNewsDetailById(newsId: number): Promise<NewsDetail | null> {
  // DB에서 news + analysis + asset join
  const raw = await newsModel.findNewsWithAnalysisById(newsId);
  if (!raw) return null;

  // raw.tags 는 문자열(JSON) 또는 배열 형태로 올 수 있으니, 한 번만 파싱
  let tagsArr: string[] = [];
  if (typeof raw.tags === "string") {
    try {
      const parsed = JSON.parse(raw.tags);
      if (Array.isArray(parsed)) tagsArr = parsed;
    } catch {
      // parsing 실패 시 빈 배열 유지
    }
  } else if (Array.isArray(raw.tags)) {
    tagsArr = raw.tags;
  }

  return {
    id: raw.id,
    title_ko: raw.title_ko,
    news_category: raw.news_category,
    thumbnail: raw.thumbnail,
    news_link: raw.news_link,
    publisher: raw.publisher,
    published_at: raw.published_at,
    summary: raw.summary,
    news_positive: raw.news_positive,
    news_negative: raw.news_negative,
    community_sentiment: String(raw.community_sentiment ?? ""),
    news_sentiment: raw.news_sentiment,
    tags: tagsArr,
    // raw 에서 직접 꺼낸 assets_* 필드
    assets_symbol: raw.assets_symbol ?? undefined,
    assets_market: raw.assets_market ?? undefined,
    assets_name: raw.assets_name ?? undefined,
  };
}

/**
 * 종목(Symbol) 기반으로 매칭된 최신 뉴스 목록 조회 (현재 ID 제외)
 */
export async function getNewsByAsset(assetSymbol: string, excludeId?: number): Promise<NewsItem[]> {
  const list = await newsModel.findNewsByAsset(assetSymbol, excludeId);

  // 프론트가 tags를 JSON 문자열로 기대하므로, 배열이면 stringify
  return list.map((item) => ({
    ...item,
    tags: Array.isArray(item.tags) ? JSON.stringify(item.tags) : item.tags,
  }));
}
