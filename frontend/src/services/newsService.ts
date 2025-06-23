// /frontend/src/services/newsService.ts
import { get } from "./apiClient";

export interface NewsItem {
  id: number;
  title: string;
  title_ko: string;
  image: string;
  category: "domestic" | "international" | "crypto";
  sentiment: number; // 1 (매우 부정) ~ 5 (매우 긍정)
  summary: string;
  brief_summary: string;
  tags: string; // JSON 문자열; 필요 시 파싱하여 사용
  published_at: string;
  publisher: string; // 퍼블리셔 필드 추가
}

export const fetchNews = async (): Promise<NewsItem[]> => {
  // baseURL이 예: "http://localhost:5000/api"이면 최종 요청 URL은 "http://localhost:5000/api/news" 입니다.
  return await get<NewsItem[]>("/news");
};