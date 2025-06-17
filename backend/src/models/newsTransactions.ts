// /backend/src/models/newsTransactions.ts
import pool from "../config/db";
import { INews, NewsAnalysis } from "./newsModel";
import { INSERT_NEWS, SELECT_NEWS_BY_LINK, INSERT_NEWS_ANALYSIS } from "./newsQueries";

/**
 * JavaScript의 Date 객체를 MySQL DATETIME 형식 (YYYY-MM-DD HH:MM:SS)으로 변환하는 헬퍼 함수
 */
const formatDateForDB = (date: Date): string => {
  return date.toISOString().slice(0, 19).replace("T", " ");
};

/**
 * 뉴스 데이터를 DB의 news 테이블에 저장하는 함수
 * 테이블 컬럼 순서: news_category, title, title_ko, content, thumbnail, news_link, publisher, published_at
 */
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

/**
 * news_link를 기준으로 뉴스가 이미 DB에 존재하는지 확인하는 함수
 */
export async function findNewsByLink(news_link: string): Promise<boolean> {
  const [rows] = await pool.query(SELECT_NEWS_BY_LINK, [news_link]);
  return (rows as any[]).length > 0;
}

/**
 * 뉴스 분석 데이터를 DB의 news_analysis 테이블에 저장하는 함수.
 * 테이블 컬럼 순서: news_id, news_sentiment, news_positive, news_negative, community_sentiment, summary, brief_summary, tags
 */
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
