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
  assets_id: number;
  uuid: Buffer;
  community_title: string;
  community_contents: string;
  category: string;
  community_img?: Buffer | null;
}) {
  return await communityModel.createCommunityPost(post);
}

export async function getCommunityPost(id: number) {
  return await communityModel.getCommunityPost(id);
}



// ...추가로 update, delete, getById 등도 여기에 작성!


// 게시글 좋아요
export async function likeCommunityPost(postId: number, user_uuid: Buffer) {
  // upsert
  await pool.query(
    `INSERT INTO likes (user_uuid, target_type, target_id, is_liked)
      VALUES (?, 'post', ?, 1)
      ON DUPLICATE KEY UPDATE is_liked=1, updated_at=NOW()`,
    [user_uuid, postId]
  );
}

// 게시글 좋아요 취소
export async function unlikeCommunityPost(postId: number, user_uuid: Buffer) {
  await pool.query(
    `INSERT INTO likes (user_uuid, target_type, target_id, is_liked)
      VALUES (?, 'post', ?, 0)
      ON DUPLICATE KEY UPDATE is_liked=0, updated_at=NOW()`,
    [user_uuid, postId]
  );
}

// 게시글 좋아요 수 집계 (post 상세 조회 시 사용)
export async function getCommunityLikesCount(postId: number) {
  const [rows]: any = await pool.query(
    `SELECT COUNT(*) AS count FROM likes WHERE target_type='post' AND target_id=? AND is_liked=1`,
    [postId]
  );
  return rows[0]?.count || 0;
}

// 현재 유저가 좋아요 했는지 (상세 조회 시 사용)
export async function isPostLikedByUser(postId: number, user_uuid: Buffer) {
  const [rows]: any = await pool.query(
    `SELECT is_liked FROM likes WHERE target_type='post' AND target_id=? AND user_uuid=?`,
    [postId, user_uuid]
  );
  return rows[0]?.is_liked === 1;
}