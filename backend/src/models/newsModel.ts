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
  news_sentiment: number;
  news_positive: string; // JSON 데이터를 문자열 형태로 저장 (예: JSON.stringify(데이터))
  news_negative: string; // JSON 데이터를 문자열 형태로 저장
  community_sentiment?: number; // 선택적 필드
  summary: string; // 뉴스의 자세한 요약 (한글 번역)
  brief_summary: string; // 뉴스 내용의 핵심을 한 줄로 간단하게 요약
  tags: string; // JSON 데이터를 문자열 형태로 저장 (예: JSON.stringify(데이터))
}
