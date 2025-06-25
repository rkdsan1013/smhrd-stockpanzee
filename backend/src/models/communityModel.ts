//backend/src/models/communityModel.ts
import pool from "../config/db";

interface CommunityPost {
  uuid: Buffer;
  community_title: string;
  community_contents: string;
  category: string;
}


// community_img는 BLOB, 없으면 null
export async function createCommunityPost(post: CommunityPost) {
  const [result]: any = await pool.query(
    `INSERT INTO community 
      (uuid, community_title, community_contents, category)
     VALUES (?, ?, ?, ?)`,
    [
      post.uuid,
      post.community_title,
      post.community_contents,
      post.category,
    ],
  );
  return result;
}

// 상세 조회
export async function getCommunityPost(id: number) {
  const [rows]: any = await pool.query(`SELECT * FROM community WHERE id = ?`, [id]);
  return rows[0]; // 하나만 반환
}



// 좋아요 조회
export async function findLike(userUuid: Buffer, targetType: string, targetId: number) {
  const [rows]: any = await pool.query(
    `SELECT is_liked FROM likes WHERE user_uuid=? AND target_type=? AND target_id=?`,
    [userUuid, targetType, targetId]
  );
  return rows[0] || null;
}

// 좋아요 토글(업데이트)
export async function updateLike(userUuid: Buffer, targetType: string, targetId: number, value: number) {
  await pool.query(
    `UPDATE likes SET is_liked=?, updated_at=NOW() WHERE user_uuid=? AND target_type=? AND target_id=?`,
    [value, userUuid, targetType, targetId]
  );
}

// 좋아요 신규 등록
export async function insertLike(userUuid: Buffer, targetType: string, targetId: number) {
  await pool.query(
    `INSERT INTO likes (user_uuid, target_type, target_id, is_liked) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE is_liked=1, updated_at=NOW()`,
    [userUuid, targetType, targetId]
  );
}

// (추가) 좋아요 개수 카운트
export async function countLikes(targetType: string, targetId: number) {
  const [rows]: any = await pool.query(
    `SELECT COUNT(*) as cnt FROM likes WHERE target_type=? AND target_id=? AND is_liked=1`,
    [targetType, targetId]
  );
  return rows[0].cnt || 0;
}

// 특정 게시글의 좋아요 카운트
export async function getLikeCount(type: string, targetId: number): Promise<number> {
  const [rows]: any = await pool.query(
    "SELECT COUNT(*) AS cnt FROM likes WHERE target_type=? AND target_id=? AND is_liked=1",
    [type, targetId]
  );
  return rows[0]?.cnt || 0;
}

// 좋아요 여부 (특정 유저가 해당 target에 좋아요를 눌렀는지)
export async function isLiked(targetType: string, targetId: number, userUuid: Buffer): Promise<boolean> {
  const [rows]: any = await pool.query(
    `SELECT is_liked FROM likes WHERE target_type=? AND target_id=? AND user_uuid=?`,
    [targetType, targetId, userUuid]
  );
  return !!(rows[0]?.is_liked === 1);
}

export async function insertLikeOrUpdate(userUuid: Buffer, targetType: string, targetId: number, value: number) {
  await pool.query(
    `INSERT INTO likes (user_uuid, target_type, target_id, is_liked)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE is_liked=VALUES(is_liked), updated_at=NOW()`,
    [userUuid, targetType, targetId, value]
  );
}
