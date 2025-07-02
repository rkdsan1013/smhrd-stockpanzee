// /backend/src/models/newsModel.ts
import db from "../config/db";
import {
  UPDATE_NEWS_VIEW_COUNT,
  SELECT_NEWS_WITH_ANALYSIS_BY_ID,
  SELECT_ALL_NEWS_WITH_ANALYSIS,
  SELECT_NEWS_BY_ASSET,
} from "./newsQueries";

export interface NewsDetailRaw {
  id: number;
  title_ko: string;
  news_category: string;
  thumbnail: string;
  news_link: string;
  publisher: string;
  published_at: Date;
  view_count: number;
  summary: string;
  news_positive: string;
  news_negative: string;
  community_sentiment: number | null;
  news_sentiment: number;
  tags: string | string[];
  assets_symbol?: string;
  assets_market?: string;
  assets_name?: string;
}

export interface NewsRow {
  id: number;
  title: string;
  title_ko?: string;
  category: "domestic" | "international" | "crypto";
  image: string;
  publisher: string;
  published_at: Date;
  view_count: number;
  sentiment: number;
  news_positive: string;
  news_negative: string;
  summary: string;
  brief_summary: string;
  tags: string;
}

/** 1) 조회수 1 증가 */
export async function incrementViewCount(newsId: number): Promise<void> {
  await db.query(UPDATE_NEWS_VIEW_COUNT, [newsId]);
}

/** 2) 뉴스 상세 + 분석 조회 */
export async function findNewsWithAnalysisById(newsId: number): Promise<NewsDetailRaw | null> {
  const [rows] = await db.query(SELECT_NEWS_WITH_ANALYSIS_BY_ID, [newsId]);
  const news = (rows as any[])[0];
  if (!news) return null;

  // tags: JSON 문자열 → 배열
  if (typeof news.tags === "string") {
    try {
      news.tags = JSON.parse(news.tags);
    } catch {
      // parsing 실패 시 무시
    }
  }
  return news;
}

/** 3) 전체 뉴스 + 분석 목록 조회 */
export async function findAllNewsWithAnalysis(): Promise<NewsRow[]> {
  const [rows] = await db.query(SELECT_ALL_NEWS_WITH_ANALYSIS);
  return (rows as any[]).map((r) => ({
    ...r,
    // tags: 배열이면 stringify, 문자열이면 그대로
    tags: typeof r.tags === "string" ? r.tags : JSON.stringify(r.tags),
  }));
}

/** 4) 종목(asset) 기반 뉴스 필터 조회 */
export async function findNewsByAsset(assetSymbol: string, excludeId?: number): Promise<NewsRow[]> {
  let sql = SELECT_NEWS_BY_ASSET;
  const params: (string | number)[] = [assetSymbol];

  if (excludeId) {
    // WHERE 뒤에 AND 조건을 붙이려면 문자열 조작
    sql = sql.replace("ORDER BY", `AND n.id != ? ORDER BY`);
    params.push(excludeId);
  }

  const [rows] = await db.query(sql, params);
  return (rows as any[]).map((r) => ({
    ...r,
    tags: typeof r.tags === "string" ? r.tags : JSON.stringify(r.tags),
  }));
}
