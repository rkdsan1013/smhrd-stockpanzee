//backend/src/services/communityService.ts
import * as communityModel from "../models/communityModel";

import pool from "../config/db";

// 게시글 전체 목록 가져오기 (예시)
export async function getCommunityPosts() {
  const [rows] = await pool.query("SELECT * FROM community ORDER BY id DESC");
  return rows;
}

// 게시글 생성
export async function createCommunityPost(post: {
  uuid: Buffer;
  community_title: string;
  community_contents: string;
  category: string;
}) {
  return await communityModel.createCommunityPost(post);
}

export async function incrementCommunityViews(postId: number) {
  console.log("[조회수 증가 호출] id=", postId);
  await pool.query(`UPDATE community SET community_views = community_views + 1 WHERE id = ?`, [
    postId,
  ]);
  console.log("[조회수 증가 완료] id=", postId);
}

export async function getCommunityPost(id: number) {
  // 무조건 최신값 SELECT
  const [rows]: any = await pool.query(`SELECT * FROM community WHERE id = ?`, [id]);
  return rows[0];
}

// ...추가로 update, delete, getById 등도 여기에 작성!

// 게시글 좋아요
export async function likeCommunityPost(postId: number, user_uuid: Buffer) {
  // upsert
  await pool.query(
    `INSERT INTO likes (user_uuid, target_type, target_id, is_liked)
      VALUES (?, 'post', ?, 1)
      ON DUPLICATE KEY UPDATE is_liked=1, updated_at=NOW()`,
    [user_uuid, postId],
  );
}

// 게시글 좋아요 취소
export async function unlikeCommunityPost(postId: number, user_uuid: Buffer) {
  await pool.query(
    `INSERT INTO likes (user_uuid, target_type, target_id, is_liked)
      VALUES (?, 'post', ?, 0)
      ON DUPLICATE KEY UPDATE is_liked=0, updated_at=NOW()`,
    [user_uuid, postId],
  );
}

// 게시글 좋아요 수 집계 (post 상세 조회 시 사용)
export async function getCommunityLikesCount(postId: number) {
  const [rows]: any = await pool.query(
    `SELECT COUNT(*) AS count FROM likes WHERE target_type='post' AND target_id=? AND is_liked=1`,
    [postId],
  );
  return rows[0]?.count || 0;
}

// 현재 유저가 좋아요 했는지 (상세 조회 시 사용)
export async function isPostLikedByUser(postId: number, user_uuid: Buffer) {
  const [rows]: any = await pool.query(
    `SELECT is_liked FROM likes WHERE target_type='post' AND target_id=? AND user_uuid=?`,
    [postId, user_uuid],
  );
  return rows[0]?.is_liked === 1;
}

// 댓글/대댓글 트리 반환
export async function getComments(comm_id: number, user_uuid?: string) {
  const [rows]: any = await pool.query(
    `SELECT cc.*, u.nickname, 
        CASE WHEN l.is_liked = 1 THEN 1 ELSE 0 END as isLiked
     FROM community_com cc
     LEFT JOIN users u ON u.uuid = cc.uuid
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

// 댓글 좋아요
export async function likeComment(commentId: number, user_uuid: Buffer) {
  await pool.query(
    `INSERT INTO likes (user_uuid, target_type, target_id, is_liked)
      VALUES (?, 'community_comment', ?, 1)
      ON DUPLICATE KEY UPDATE is_liked=1, updated_at=NOW()`,
    [user_uuid, commentId],
  );
}
// 댓글 좋아요 취소
export async function unlikeComment(commentId: number, user_uuid: Buffer) {
  await pool.query(
    `INSERT INTO likes (user_uuid, target_type, target_id, is_liked)
      VALUES (?, 'community_comment', ?, 0)
      ON DUPLICATE KEY UPDATE is_liked=0, updated_at=NOW()`,
    [user_uuid, commentId],
  );
}
