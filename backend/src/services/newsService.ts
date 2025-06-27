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

  // raw.tags 는 모델 레이어에서 문자열(JSON) 또는 배열로 내려올 수 있음
  // → 여기서 단 한 번만 파싱
  let tagsArr: string[] = [];
  if (typeof raw.tags === "string") {
    try {
      const parsed = JSON.parse(raw.tags);
      if (Array.isArray(parsed)) tagsArr = parsed;
    } catch {
      // parsing 실패하면 빈 배열 유지
    }
  } else if (Array.isArray(raw.tags)) {
    tagsArr = raw.tags;
  }

  // Asset 정보가 들어있는 raw.asset 대신, 필드만 꺼내서 반환
  const asset = raw.asset ?? null;

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
    assets_symbol: asset?.symbol,
    assets_market: asset?.market,
    assets_name: asset?.name,
  };
}

/**
 * 종목(Symbol) 기반으로 매칭된 최신 뉴스 목록 조회 (현재 ID 제외)
 */
export async function getNewsByAsset(assetSymbol: string, excludeId?: number): Promise<NewsItem[]> {
  const list = await newsModel.findNewsByAsset(assetSymbol, excludeId);

  // findNewsByAsset 에서 tags 필드는 JSON.parse 처리된 배열일 수도 있으니,
  // 프론트엔드가 string 으로 기대하는 형태로 바꿔줍니다.
  return list.map((item) => ({
    ...item,
    tags: Array.isArray(item.tags) ? JSON.stringify(item.tags) : item.tags,
  }));
}
