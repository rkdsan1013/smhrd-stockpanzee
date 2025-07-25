// /backend/src/models/newsTransactions.ts
import pool from "../config/db";
import { INews, NewsAnalysis } from "./newsModel"; // 이제 정상 import
import {
  INSERT_NEWS,
  UPDATE_NEWS_TITLE_KO,
  SELECT_NEWS_BY_LINK,
  INSERT_NEWS_ANALYSIS,
  SELECT_ALL_NEWS_WITH_ANALYSIS,
} from "./newsQueries";

/* ISO 8601 → 'YYYY-MM-DD HH:MM:SS' */
const formatDateForDB = (d: Date) => d.toISOString().slice(0, 19).replace("T", " ");

/** 새 뉴스 생성 */
export async function createNews(news: INews): Promise<number> {
  const [res] = await pool.query(INSERT_NEWS, [
    news.news_category,
    news.title,
    news.title_ko ?? null,
    news.content,
    news.thumbnail,
    news.news_link,
    news.publisher,
    formatDateForDB(news.published_at),
  ]);
  return (res as any).insertId;
}

/** 링크 중복 체크 */
export async function findNewsByLink(news_link: string): Promise<boolean> {
  const [rows] = await pool.query(SELECT_NEWS_BY_LINK, [news_link]);
  return (rows as any[]).length > 0;
}

/** 뉴스 분석 저장 */
export async function createNewsAnalysis(analysis: NewsAnalysis): Promise<void> {
  await pool.query(INSERT_NEWS_ANALYSIS, [
    analysis.news_id,
    analysis.news_sentiment,
    analysis.news_positive,
    analysis.news_negative,
    analysis.community_sentiment ?? null,
    analysis.summary,
    analysis.brief_summary,
    analysis.tags,
  ]);
}

/** 뉴스 한글 제목 업데이트 */
export async function updateNewsTitleKo(newsId: number, titleKo: string): Promise<void> {
  await pool.query(UPDATE_NEWS_TITLE_KO, [titleKo, newsId]);
}

/** 전체 뉴스 + 분석 목록 조회 */
export async function getAllNews(): Promise<any[]> {
  const [rows] = await pool.query(SELECT_ALL_NEWS_WITH_ANALYSIS);
  return rows as any[];
}

/** 뉴스 + 분석 트랜잭션 저장 */
export async function createNewsWithAnalysis(
  news: INews,
  analysis: Omit<NewsAnalysis, "news_id">,
  translatedTitle: string,
): Promise<number> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) News
    const [newsRes] = await conn.query(INSERT_NEWS, [
      news.news_category,
      news.title,
      news.title_ko ?? null,
      news.content,
      news.thumbnail,
      news.news_link,
      news.publisher,
      formatDateForDB(news.published_at),
    ]);
    const newsId = (newsRes as any).insertId;

    // 2) Title Ko
    await conn.query(UPDATE_NEWS_TITLE_KO, [translatedTitle, newsId]);

    // 3) Analysis
    await conn.query(INSERT_NEWS_ANALYSIS, [
      newsId,
      analysis.news_sentiment,
      analysis.news_positive,
      analysis.news_negative,
      analysis.community_sentiment ?? null,
      analysis.summary,
      analysis.brief_summary,
      analysis.tags,
    ]);

    await conn.commit();
    return newsId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
