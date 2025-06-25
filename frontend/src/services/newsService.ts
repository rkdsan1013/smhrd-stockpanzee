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
// 메인 뉴스 리스트용
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

// 상세 뉴스용
export interface AssetInfo {
  id: number;            // ← 이게 반드시 있어야 함!
  symbol: string;
  name: string;
  market: string;
  current_price: number;
  price_change: number;
}

// /frontend/src/services/newsService.ts

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



export const fetchNews = async (): Promise<NewsItem[]> => {
  // baseURL이 예: "http://localhost:5000/api"이면 최종 요청 URL은 "http://localhost:5000/api/news" 입니다.
  return await get<NewsItem[]>("/news");
};


// 상세 뉴스 API
export const fetchNewsDetail = async (id: number): Promise<NewsDetail> => {
  return await get<NewsDetail>(`/news/${id}`);
};

// 최신 뉴스 리스트 (같은 종목, 현재 id는 제외)
export const fetchLatestNewsByAsset = async (assetSymbol: string, excludeId?: number): Promise<NewsItem[]> => {
  let url = `/news?asset=${encodeURIComponent(assetSymbol)}`;
  if (excludeId) url += `&exclude=${excludeId}`;
  return await get<NewsItem[]>(url);
};