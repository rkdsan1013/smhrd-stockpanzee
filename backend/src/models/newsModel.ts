// /backend/src/models/newsModel.ts
export interface INews {
  news_category: "domestic" | "international" | "crypto";
  title: string;
  title_ko?: string;
  content: string;
  thumbnail: string;
  news_link: string;
  publisher: string;
  published_at: Date;
}
export interface NewsAnalysis {
  news_id: number;
  news_sentiment: number; // 1 ~ 5 (1: 매우 부정, 5: 매우 긍정)
  news_positive: string; // JSON 문자열로 저장 (예: '["긍정포인트1", "긍정포인트2"]')
  news_negative: string; // JSON 문자열로 저장
  community_sentiment?: number;
  summary: string;
  brief_summary: string;
  tags: string; // JSON 문자열 (예: '["BTC", "ETH"]')
}