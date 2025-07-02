
// /backend/src/models/commentModel.ts
import pool from "../config/db";

export async function updateCommentRow(id: number, content: string) {
  const [result]: any = await pool.query(
    `UPDATE comments SET content = ?, updated_at = NOW() WHERE id = ?`,
    [content, id]
  );
  return result;
}

export async function deleteCommentRow(id: number) {
  const [result]: any = await pool.query(
    `DELETE FROM comments WHERE id = ?`,
    [id]
  );
  return result;
}