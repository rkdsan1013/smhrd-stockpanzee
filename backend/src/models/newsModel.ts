// /backend/src/models/newsModel.ts

import db from "../config/db";

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
  news_sentiment: number; // 1 ~ 5 (1: 매우 부정, 5: 매우긍정)
  news_positive: string; // JSON 문자열 (예: '["긍정포인트1", "긍정포인트2"]')
  news_negative: string; // JSON 문자열
  community_sentiment?: number;
  summary: string;
  brief_summary: string;
  tags: string; // JSON 문자열 (예: '["BTC", "ETH"]')
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
}

// news + news_analysis 조인
export async function findNewsWithAnalysisById(newsId: number) {
  const [rows] = await db.query(
    `SELECT
      n.id,
      n.title_ko,
      n.news_category,
      n.thumbnail,
      n.news_link,
      n.publisher,
      n.published_at,
      na.summary,
      na.news_positive,
      na.news_negative,
      na.community_sentiment,
      na.news_sentiment,
      na.tags,
      a.symbol AS assets_symbol,
      a.market AS assets_market,
      a.name AS assets_name
    FROM news n
    LEFT JOIN news_analysis na ON n.id = na.news_id
    LEFT JOIN assets a ON JSON_CONTAINS(na.tags, JSON_QUOTE(a.symbol), '$')
    WHERE n.id = ?
    LIMIT 1`,
    [newsId],
  );
  if ((rows as any[]).length === 0) return null;
  const news = (rows as any[])[0];
  // tags JSON 파싱
  if (typeof news.tags === "string") {
    try {
      news.tags = JSON.parse(news.tags);
    } catch {}
  }
  return news;
}

// 종목 심볼(assetSymbol) 기준으로 필터된 뉴스 목록 조회
export async function findNewsByAsset(assetSymbol: string, excludeId?: number) {
  // na.tags JSON에서 assetSymbol 포함 여부 검사
  let sql = `
    SELECT
      n.id,
      n.title,
      n.title_ko,
      n.news_category AS news_category,
      n.thumbnail AS thumbnail,
      n.publisher,
      n.published_at,
      na.news_sentiment AS news_sentiment,
      na.brief_summary AS brief_summary,
      na.summary AS summary,
      na.news_positive AS news_positive,
      na.news_negative AS news_negative,
      na.tags AS tags
    FROM news n
    LEFT JOIN news_analysis na
      ON n.id = na.news_id
    WHERE JSON_CONTAINS(na.tags, JSON_QUOTE(?), '$')
  `;
  const params: (string | number)[] = [assetSymbol];
  if (excludeId) {
    sql += ` AND n.id != ?`;
    params.push(excludeId);
  }
  sql += ` ORDER BY n.published_at DESC`;

  const [rows] = await db.query(sql, params);
  return (rows as any[]).map((row) => ({
    ...row,
    tags: typeof row.tags === "string" ? JSON.parse(row.tags) : row.tags,
  }));
}
