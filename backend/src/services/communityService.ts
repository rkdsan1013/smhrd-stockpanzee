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

// ...추가로 update, delete, getById 등도 여기에 작성!
