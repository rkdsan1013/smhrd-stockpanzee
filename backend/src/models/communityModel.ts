//backend/src/models/communityModel.ts
import pool from "../config/db";

interface CommunityPost {
  assets_id: number;
  uuid: Buffer;
  community_title: string;
  community_contents: string;
  category: string;
  community_img?: Buffer | null;
}

// community_img는 BLOB, 없으면 null
export async function createCommunityPost(post: CommunityPost) {
  const [result]: any = await pool.query(
    `INSERT INTO community 
      (assets_id, uuid, community_title, community_contents, category, community_img)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      post.assets_id,
      post.uuid,
      post.community_title,
      post.community_contents,
      post.category,
      post.community_img ?? null,
    ],
  );
  return result;
}

// 상세 조회
export async function getCommunityPost(id: number) {
  const [rows]: any = await pool.query(`SELECT * FROM community WHERE id = ?`, [id]);
  return rows[0]; // 하나만 반환
}
