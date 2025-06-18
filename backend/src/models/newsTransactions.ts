// /backend/src/models/newsTransactions.ts
import pool from "../config/db";
import { INews, NewsAnalysis } from "./newsModel";
import { INSERT_NEWS, SELECT_NEWS_BY_LINK, INSERT_NEWS_ANALYSIS } from "./newsQueries";

/** JavaScript Date 객체를 MySQL DATETIME 형식(YYYY-MM-DD HH:MM:SS)으로 변환 */
const formatDateForDB = (date: Date): string => {
  return date.toISOString().slice(0, 19).replace("T", " ");
};

/** 뉴스 저장 */
export async function createNews(news: INews): Promise<number> {
  const [result] = await pool.query(INSERT_NEWS, [
    news.news_category,
    news.title,
    news.title_ko || null,
    news.content,
    news.thumbnail,
    news.news_link,
    news.publisher,
    formatDateForDB(news.published_at),
  ]);
  return (result as any).insertId;
}

/** 중복 뉴스 체크 */
export async function findNewsByLink(news_link: string): Promise<boolean> {
  const [rows] = await pool.query(SELECT_NEWS_BY_LINK, [news_link]);
  return (rows as any[]).length > 0;
}

/** 뉴스 분석 데이터 저장 */
export async function createNewsAnalysis(analysis: NewsAnalysis): Promise<void> {
  await pool.query(INSERT_NEWS_ANALYSIS, [
    analysis.news_id,
    analysis.news_sentiment,
    analysis.news_positive,
    analysis.news_negative,
    analysis.community_sentiment || null,
    analysis.summary,
    analysis.brief_summary,
    analysis.tags,
  ]);
}

/** 뉴스 테이블의 title_ko 업데이트 */
export const UPDATE_NEWS_TITLE_KO = `
  UPDATE news
  SET title_ko = ?
  WHERE id = ?
`;

export async function updateNewsTitleKo(newsId: number, titleKo: string): Promise<void> {
  await pool.query(UPDATE_NEWS_TITLE_KO, [titleKo, newsId]);
}

/** 저장된 뉴스와 뉴스 분석 데이터를 조인하여 조회 (최신 뉴스 우선) */
export async function getAllNews(): Promise<any[]> {
  const query = `
    SELECT 
      n.id, 
      n.title, 
      n.title_ko, 
      n.news_category AS category, 
      n.thumbnail AS image, 
      n.published_at, 
      na.news_sentiment AS sentiment,  -- alias 처리
      na.news_positive, 
      na.news_negative, 
      na.summary, 
      na.brief_summary, 
      na.tags
    FROM news n
    LEFT JOIN news_analysis na ON n.id = na.news_id
    ORDER BY n.published_at DESC
  `;
  const [rows] = await pool.query(query);
  return rows as any[];
}