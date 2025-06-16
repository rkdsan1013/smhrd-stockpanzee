// /backend/src/models/newsModel.ts
import pool from "../config/db";
import { INews } from "../utils/news/cryptoNewsMapper";

export async function createNews(news: INews): Promise<number> {
  const sql = `
    INSERT INTO news (title, content, news_link, thumbnail, published_at, source_title)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.query(sql, [
    news.title,
    news.content,
    news.news_link,
    news.thumbnail,
    news.published_at,
    news.source_title,
  ]);
  const insertId = (result as any).insertId;
  return insertId;
}

export async function findNewsByLink(news_link: string): Promise<boolean> {
  const sql = `SELECT id FROM news WHERE news_link = ? LIMIT 1`;
  const [rows] = await pool.query(sql, [news_link]);
  return (rows as any[]).length > 0;
}
