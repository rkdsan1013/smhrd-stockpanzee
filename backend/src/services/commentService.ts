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



// 댓글/대댓글 트리 반환
export async function getComments(comm_id: number, user_uuid?: string) {
  const [rows]: any = await pool.query(
    `SELECT cc.*, p.name AS nickname, 
        CASE WHEN l.is_liked = 1 THEN 1 ELSE 0 END as isLiked
     FROM community_com cc
     LEFT JOIN users u ON u.uuid = cc.uuid
     LEFT JOIN user_profiles p ON u.uuid = p.uuid
     LEFT JOIN likes l ON l.user_uuid = ? AND l.target_type='community_comment' AND l.target_id=cc.id
     WHERE cc.comm_id=? ORDER BY cc.created_at ASC`,
    [user_uuid ?? Buffer.alloc(16), comm_id],
  );

  // 1차: 댓글, 2차: 대댓글로 분류
  const comments = rows
    .filter((r: any) => !r.parent_id)
    .map((row: any) => ({
      id: row.id,
      nickname: row.nickname,
      createdAt: row.created_at,
      content: row.comm_contents,
      likes: row.comm_likes,
      imgUrl: row.comm_img
        ? `data:image/jpeg;base64,${row.comm_img.toString("base64")}`
        : undefined,
      isLiked: !!row.isLiked,
      replies: rows
        .filter((r: any) => r.parent_id === row.id)
        .map((reply: any) => ({
          id: reply.id,
          nickname: reply.nickname,
          createdAt: reply.created_at,
          content: reply.comm_contents,
          likes: reply.comm_likes,
          imgUrl: reply.comm_img
            ? `data:image/jpeg;base64,${reply.comm_img.toString("base64")}`
            : undefined,
          isLiked: !!reply.isLiked,
        })),
    }));
  return comments;
}


// 댓글/대댓글 생성
export async function createComment(data: {
  comm_id: number;
  uuid: Buffer;
  comm_contents: string;
  comm_img?: Buffer | null;
  parent_id?: number | null;
}) {
  const [result]: any = await pool.query(
    `INSERT INTO community_com (comm_id, uuid, comm_contents, comm_img, parent_id)
     VALUES (?, ?, ?, ?, ?)`,
    [data.comm_id, data.uuid, data.comm_contents, data.comm_img ?? null, data.parent_id ?? null],
  );
  return result;
}