// /backend/src/models/newsAnalysisModel.ts
import pool from "../config/db";

export interface NewsAnalysis {
  news_id: number;
  summary: string;
  sentiment: number;
  tags: string;
  market: "domestic" | "international" | "crypto";
}

export async function createNewsAnalysis(analysis: NewsAnalysis): Promise<void> {
  const sql = `
    INSERT INTO news_analysis (news_id, summary, sentiment, tags, market)
    VALUES (?, ?, ?, ?, ?)
  `;
  await pool.query(sql, [
    analysis.news_id,
    analysis.summary,
    analysis.sentiment,
    analysis.tags,
    analysis.market,
  ]);
}
