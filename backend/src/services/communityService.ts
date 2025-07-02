// /backend/src/services/communityService.ts
import * as communityModel from "../models/communityModel";
import pool from "../config/db";

// ===================== 기존 게시글 관련 함수 =====================

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

export async function createCommunityPost(post: {
  uuid: Buffer;
  community_title: string;
  community_contents: string;
  category: string;
  img_url?: string;
}) {
  return await communityModel.createCommunityPost(post);
}

// 글 수정
export async function updateCommunityPost(id: number, post: {
  community_title: string;
  community_contents: string;
  category: string;
  img_url?: string | null;
}) {
  return await communityModel.updateCommunityPost(id, post);
}

export async function incrementCommunityViews(postId: number) {
  await pool.query(
    `UPDATE community SET community_views = community_views + 1 WHERE id = ?`,
    [postId]
  );
}

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

// ... 기타 게시글 함수 (toggleLike, isPostLikedByUser 등) 그대로 ...

export async function toggleLike(
  userUuid: Buffer, 
  targetType: string, 
  targetId: number
) {
  const row = await communityModel.findLike(userUuid, targetType, targetId);
  if (row) {
    const newValue = row.is_liked === 1 ? 0 : 1;
    await communityModel.updateLike(userUuid, targetType, targetId, newValue);
    return newValue === 1;
  } else {
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
    `SELECT id FROM comments WHERE target_type='community' AND target_id=?`,
    [postId]
  );
  const commentIds = commentRows.map((row: any) => row.id);

  // 2. 트랜잭션 시작
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 3. 댓글 좋아요 삭제 (댓글 있을 때만)
    if (commentIds.length > 0) {
      await conn.query(
        `DELETE FROM likes WHERE target_type='community_comment' AND target_id IN (${commentIds.map(() => '?').join(',')})`,
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
      `DELETE FROM comments WHERE target_type='community' AND target_id=?`,
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

// ===================== 👇👇 댓글/대댓글 CRUD 함수 추가!! 👇👇 =====================

// 댓글 트리 반환
export async function fetchComments(target_type: string, target_id: number) {
  const rows = await communityModel.getComments(target_type, target_id);
  // 1차: 댓글, 2차: 대댓글로 트리 변환
  const commentMap = new Map<number, any>();
  const comments: any[] = [];
  rows.forEach((row: any) => {
    row.replies = [];
    commentMap.set(row.id, row);
    if (!row.parent_id) comments.push(row);
  });
  rows.forEach((row: any) => {
    if (row.parent_id && commentMap.has(row.parent_id)) {
      commentMap.get(row.parent_id).replies.push(row);
    }
  });
  return comments;
}

// 댓글 생성
export async function createComment(params: {
  uuid: Buffer,
  target_type: string,
  target_id: number,
  parent_id?: number | null,
  content: string,
  img_url?: string
}) {
  return communityModel.insertComment(params);
}


// 댓글 수정
export async function updateComment(id: number, content: string, uuid: Buffer) {
  return communityModel.updateComment(id, content, uuid);
}

// 댓글 삭제
export async function deleteComment(id: number, uuid: Buffer) {
  return communityModel.deleteComment(id, uuid);
}

// 댓글 좋아요 카운트 함수 추가
export async function getCommentLikesCount(commentId: number) {
  return communityModel.getLikeCount("community_comment", commentId);
}
