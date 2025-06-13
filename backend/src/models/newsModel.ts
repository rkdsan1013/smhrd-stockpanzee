// /backend/src/models/newsModel.ts
import pool from "../config/db";

/**
 * INews 인터페이스는 API 응답 데이터를 내부 모델로 변환한 후, DB에 저장할 때 사용할 뉴스 데이터 구조입니다.
 */
export interface INews {
  externalId: string; // 외부 API의 뉴스 고유 ID
  title: string;
  thumbnail: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 뉴스 데이터를 데이터베이스에 저장합니다.
 * 동일 externalId가 이미 존재하면 업데이트 처리합니다.
 */
export const createNews = async (news: INews): Promise<void> => {
  const sql = `
    INSERT INTO news (external_id, title, thumbnail, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE title = VALUES(title), thumbnail = VALUES(thumbnail), content = VALUES(content), updated_at = NOW()
  `;
  await pool.query(sql, [news.externalId, news.title, news.thumbnail, news.content]);
};

/**
 * 외부 ID를 통해 뉴스 데이터를 조회합니다.
 */
export const findNewsByExternalId = async (externalId: string): Promise<INews | null> => {
  const sql = `
    SELECT external_id AS externalId, title, thumbnail, content, created_at AS createdAt, updated_at AS updatedAt
    FROM news
    WHERE external_id = ?
    LIMIT 1
  `;
  const [rows]: any = await pool.query(sql, [externalId]);
  return rows && rows.length > 0 ? rows[0] : null;
};

/**
 * 최신 뉴스 데이터를 모두 조회합니다.
 */
export const getAllNews = async (): Promise<INews[]> => {
  const sql = `
    SELECT external_id AS externalId, title, thumbnail, content, created_at AS createdAt, updated_at AS updatedAt
    FROM news
    ORDER BY created_at DESC
  `;
  const [rows]: any = await pool.query(sql);
  return rows;
};
