// /backend/src/services/commentService.ts
import * as commentModel from "../models/commentModels";
import pool from "../config/db";

export async function updateComment(commentId: number, content: string) {
  await pool.query(
    `UPDATE community_com SET content = ?, updated_at = NOW() WHERE id = ?`,
    [content, commentId]
  );
}

export async function deleteComment(commentId: number) {
  // 댓글과 그 하위 대댓글을 함께 삭제
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // 대댓글 삭제
    await conn.query(
      `DELETE FROM community_com WHERE parent_id = ?`,
      [commentId]
    );
    // 댓글 삭제
    await conn.query(
      `DELETE FROM community_com WHERE id = ?`,
      [commentId]
    );
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}