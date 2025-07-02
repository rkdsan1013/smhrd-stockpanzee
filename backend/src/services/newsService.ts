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
  published_at: string; // ISO string
  publisher: string;
  view_count: number;
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
  tags: string[];
  assets_symbol?: string;
  assets_market?: string;
  assets_name?: string;
  view_count: number;
}

// 조회수 증가
export async function incrementViewCount(newsId: number): Promise<void> {
  return newsModel.incrementViewCount(newsId);
}

// 상세 조회
export async function getNewsDetailById(newsId: number): Promise<NewsDetail | null> {
  const raw = await newsModel.findNewsWithAnalysisById(newsId);
  if (!raw) return null;
  const tagsArr = Array.isArray(raw.tags)
    ? raw.tags
    : (() => {
        try {
          return JSON.parse(raw.tags as string);
        } catch {
          return [];
        }
      })();
  return {
    id: raw.id,
    title_ko: raw.title_ko,
    news_category: raw.news_category,
    thumbnail: raw.thumbnail,
    news_link: raw.news_link,
    publisher: raw.publisher,
    published_at: raw.published_at.toISOString(),
    summary: raw.summary,
    news_positive: raw.news_positive,
    news_negative: raw.news_negative,
    community_sentiment: String(raw.community_sentiment ?? ""),
    news_sentiment: raw.news_sentiment,
    tags: tagsArr,
    assets_symbol: raw.assets_symbol,
    assets_market: raw.assets_market,
    assets_name: raw.assets_name,
    view_count: raw.view_count,
  };
}

// 종목별 최신 뉴스 조회
export async function getNewsByAsset(assetSymbol: string, excludeId?: number): Promise<NewsItem[]> {
  const list = await newsModel.findNewsByAsset(assetSymbol, excludeId);
  return list.map((item) => ({
    id: item.id,
    title: item.title,
    title_ko: item.title_ko,
    image: item.image,
    category: item.category,
    sentiment: item.sentiment, // 이제 실제 news_sentiment 값(1~5)이 내려갑니다
    summary: item.summary,
    brief_summary: item.brief_summary,
    tags: item.tags,
    published_at: item.published_at.toISOString(),
    publisher: item.publisher,
    view_count: item.view_count,
  }));
}
