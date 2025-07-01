// /frontend/src/services/newsService.ts
import { get } from "./apiClient";

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
  tags: string[]; // 배열로 파싱
  assets_symbol?: string;
  assets_market?: string;
  assets_name?: string;
}

/**
 * 전체 뉴스 목록 조회
 */
export const fetchNews = async (): Promise<NewsItem[]> => {
  return await get<NewsItem[]>("/news");
};

/**
 * 상세 뉴스 조회
 */
export const fetchNewsDetail = async (id: number): Promise<NewsDetail> => {
  return await get<NewsDetail>(`/news/${id}`);
};

/**
 * 종목(Symbol) 기반으로 매칭된 최신 뉴스 목록 조회 (현재 ID 제외)
 */
export const fetchLatestNewsByAsset = async (
  assetSymbol: string,
  excludeId?: number,
): Promise<NewsItem[]> => {
  let url = `/news?asset=${encodeURIComponent(assetSymbol)}`;
  if (excludeId) {
    url += `&exclude=${excludeId}`;
  }
  return await get<NewsItem[]>(url);
};
