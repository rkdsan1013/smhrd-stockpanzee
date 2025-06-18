// /frontend/src/services/newsService.ts
import { get } from "./apiClient";

export interface NewsItem {
  id: number;
  title: string;
  title_ko: string;
  image: string;
  category: "domestic" | "international" | "crypto";
  sentiment: number; // news_sentiment 값: 1 (매우 부정) ~ 5 (매우 긍정)
  community_sentiment?: number; // 백엔드에서 함께 불러오지만 표시에는 사용하지 않음.
  summary: string;
  brief_summary: string;
  tags: string; // JSON 문자열 (필요 시 파싱)
  published_at: string;
}

export const fetchNews = async (): Promise<NewsItem[]> => {
  // baseURL이 예: "http://localhost:5000/api"이면 최종 요청 URL은 "http://localhost:5000/api/news" 입니다.
  return await get<NewsItem[]>("/news");
};