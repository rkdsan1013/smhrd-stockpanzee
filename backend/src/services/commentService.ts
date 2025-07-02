// /backend/src/services/commentService.ts
import * as commentModel from "../models/commentModels";
import pool from "../config/db";

/** 댓글/대댓글 트리 반환 (커뮤니티 only) */
export async function getComments(target_id: number, user_uuid?: Buffer) {
  // target_type: 'community'로 고정
  const [rows]: any = await pool.query(
    `SELECT cc.*, 
            p.name AS name,
            (SELECT COUNT(*) FROM likes WHERE target_type='community_comment' AND target_id=cc.id AND is_liked=1) as likes,
            CASE WHEN l.is_liked = 1 THEN 1 ELSE 0 END as isLiked
     FROM comments cc
     LEFT JOIN users u ON u.uuid = cc.uuid
     LEFT JOIN user_profiles p ON u.uuid = p.uuid
     LEFT JOIN likes l 
            ON l.user_uuid = ? AND l.target_type='community_comment' AND l.target_id=cc.id
     WHERE cc.target_type='community' AND cc.target_id=?
     ORDER BY cc.created_at ASC
    `,
    [user_uuid ?? Buffer.alloc(16), target_id]
  );

  // 트리 변환
  const comments = rows
    .filter((r: any) => !r.parent_id)
    .map((row: any) => ({
      id: row.id,
      uuid: row.uuid?.toString('hex'),
      name: row.name,
      content: row.content,
      likes: row.likes || 0,
      createdAt: row.created_at,
      isLiked: !!row.isLiked,
      img_url: row.img_url || null,  
      replies: rows
        .filter((r: any) => r.parent_id === row.id)
        .map((reply: any) => ({
          id: reply.id,
          uuid: reply.uuid?.toString('hex'),
          name: reply.name,
          content: reply.content,
          likes: reply.likes || 0,
          createdAt: reply.created_at,
          isLiked: !!reply.isLiked,
          img_url: reply.img_url || null,
        })),
    }));

  return comments;
}

export async function updateComment(commentId: number, content: string) {
  return commentModel.updateCommentRow(commentId, content);
}

export async function deleteComment(commentId: number) {
  // 댓글/대댓글 동시 삭제 (트랜잭션)
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(`DELETE FROM comments WHERE parent_id = ?`, [commentId]);
    await conn.query(`DELETE FROM comments WHERE id = ?`, [commentId]);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
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
    `INSERT INTO comments (comm_id, uuid, comm_contents, comm_img, parent_id)
     VALUES (?, ?, ?, ?, ?)`,
    [data.comm_id, data.uuid, data.comm_contents, data.comm_img ?? null, data.parent_id ?? null],
  );
  return result;
}