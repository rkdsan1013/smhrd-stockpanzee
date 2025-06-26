//backend/src/services/communityService.ts
import * as communityModel from "../models/communityModel";

import pool from "../config/db";

// 게시글 전체 목록
export async function getCommunityPosts() {
  const [rows] = await pool.query(`
    SELECT c.*, p.name AS nickname,
      (SELECT COUNT(*) FROM likes WHERE target_type='post' AND target_id=c.id AND is_liked=1) AS community_likes
    FROM community c
    LEFT JOIN users u ON c.uuid = u.uuid
    LEFT JOIN user_profiles p ON u.uuid = p.uuid
    ORDER BY c.id DESC
  `);
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

// 게시글 상세조회
export async function getCommunityPost(id: number) {
  const [rows]: any = await pool.query(`
    SELECT c.*, p.name AS nickname
    FROM community c
    LEFT JOIN users u ON c.uuid = u.uuid
    LEFT JOIN user_profiles p ON u.uuid = p.uuid
    WHERE c.id = ?
  `, [id]);
  return rows[0];
}

// ...추가로 update, delete, getById 등도 여기에 작성!


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


export async function toggleLike(
  userUuid: Buffer, 
  targetType: string, 
  targetId: number
) {
  const row = await communityModel.findLike(userUuid, targetType, targetId);

  if (row) {
    // row가 있고 is_liked가 1이면 0으로(취소), 0이면 1로(재좋아요)
    const newValue = row.is_liked === 1 ? 0 : 1;
    await communityModel.updateLike(userUuid, targetType, targetId, newValue);
    return newValue === 1;
  } else {
    // row 없으면 insert
    // 👉 INSERT ON DUPLICATE KEY UPDATE 형태로 변경 추천!
    await communityModel.insertLikeOrUpdate(userUuid, targetType, targetId, 1);
    return true;
  }
}

export async function isPostLikedByUser(postId: number, userUuid: Buffer) {
  return communityModel.isLiked("post", postId, userUuid);
}

export async function getCommunityLikesCount(postId: number) {
  return communityModel.getLikeCount("post", postId);
}

export async function deleteCommunityPost(postId: number) {
  // 1. 해당 게시글의 모든 댓글 id 가져오기
  const [commentRows]: any = await pool.query(
    `SELECT id FROM community_com WHERE comm_id = ?`,
    [postId]
  );
  const commentIds = commentRows.map((row: any) => row.id);

  // 2. 트랜잭션 시작
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 3. 댓글 좋아요 삭제 (댓글 있을 때만)
    if (commentIds.length > 0) {
      // mysql2의 IN (?) 문법은 배열이 들어가면 (?,?,?) 형태로 변환됨
      await conn.query(
        `DELETE FROM likes WHERE target_type='community_com' AND target_id IN (${commentIds.map(() => '?').join(',')})`,
        commentIds
      );
    }
    // 4. 게시글 좋아요 삭제
    await conn.query(
      `DELETE FROM likes WHERE target_type='post' AND target_id=?`,
      [postId]
    );
    // 5. 댓글/대댓글 삭제
    await conn.query(
      `DELETE FROM community_com WHERE comm_id=?`,
      [postId]
    );
    // 6. 게시글 삭제
    await conn.query(
      `DELETE FROM community WHERE id=?`,
      [postId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
