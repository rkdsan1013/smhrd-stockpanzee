// /backend/src/controllers/communityController.ts
import { Request, Response, NextFunction } from "express";
import * as communityService from "../services/communityService";
import * as communityModel from "../models/communityModel";
import pool from "../config/db";


// multer 적용 시에만 req.file 사용하기 위한 인터페이스 확장
export interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// 게시글 목록 조회
export const getCommunityPosts = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const posts = await communityService.getCommunityPosts();
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

// 좋아요 여부 (특정 유저가 해당 게시글에 좋아요 했는지)
export async function isPostLikedByUser(postId: number, userUuid: Buffer): Promise<boolean> {
  const row = await communityModel.findLike(userUuid, "post", postId);
  return !!(row && row.is_liked === 1);
}

// 게시글 좋아요 개수
export async function getCommunityLikesCount(postId: number): Promise<number> {
  return communityModel.getLikeCount("post", postId);
}


// 게시글 상세 조회 (조회수 1 증가)
export const getCommunityPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);

    await communityService.incrementCommunityViews(id);

    const post = await communityService.getCommunityPost(id);

    if (!post) {
      res.status(404).json({ message: "게시글을 찾을 수 없습니다" });
      return;
    }

    // uuid를 반드시 hex string으로 변환
    if (post.uuid && Buffer.isBuffer(post.uuid)) {
      post.uuid = post.uuid.toString("hex");
    }

    // 이미지 BLOB → base64
    if (post.community_img) {
      post.community_img = post.community_img.toString("base64");
    }

    const user_uuid = (req as any).user?.uuid;
    let isLiked = false;
    if (user_uuid) {
      isLiked = await communityService.isPostLikedByUser(id, Buffer.from(user_uuid, "hex"));
    }
    const community_likes = await communityService.getCommunityLikesCount(id);

    res.json({
      ...post,
      community_likes,
      isLiked,
    });
  } catch (err) {
    next(err);
  }
};


// 게시글 등록 
export const createCommunityPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const r = req as MulterRequest;

  try {
    const { community_title, community_contents, category } = r.body;
    const uuid = (r as any).user?.uuid; // 인증 미들웨어에서 유저 정보 받아옴

    if (!uuid || !community_title || !community_contents || !category) {
      res.status(400).json({ message: "필수값 누락" });
      return;
    }

    const uuidBuffer = Buffer.from(uuid.replace(/-/g, ""), "hex");
    const result = await communityService.createCommunityPost({
      uuid: uuidBuffer,
      community_title,
      community_contents,
      category,
    });

    if (!result.insertId) {
      res.status(500).json({ message: "DB 저장 실패" });
      return;
    }

    res.status(201).json({
      message: "게시글 등록 완료",
      id: result.insertId,
    });
  } catch (err) {
    next(err);
  }
};


// 게시글 수정
export const updateCommunityPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const { community_title, community_contents, category } = req.body;
    // ★ 작성자 본인 확인 필요! (생략 시 주석)

    await pool.query(
      `UPDATE community SET community_title=?, community_contents=?, category=?, updated_at=NOW() WHERE id=?`,
      [community_title, community_contents, category, id]
    );
    res.json({ success: true });
  } catch (err) {
    next(err); // 에러 핸들링 미들웨어로 전달
  }
};

// 댓글 트리 가져오기
export const getComments = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const comm_id = Number(req.params.id);
    const user_uuid = (req as any).user?.uuid;
    const comments = await communityService.getComments(comm_id, user_uuid);
    res.json(comments);
  } catch (err) {
    next(err);
  }
};

// 댓글/대댓글 등록
export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { content, parent_id, uuid } = req.body;
    const comm_id = Number(req.params.id);
    if (!content) {
      res.status(400).json({ message: "내용 누락" });
      return;
    }
    const img = (req as MulterRequest).file?.buffer ?? null;
    // uuid는 로그인시 req.user에서 가져오는 게 보통이지만, 미로그인 대응 시 프론트에서 받아도 됨
    const uuidBuffer = Buffer.from(uuid?.replace(/-/g, ""), "hex");
    const result = await communityService.createComment({
      comm_id,
      uuid: uuidBuffer,
      comm_contents: content,
      comm_img: img,
      parent_id: parent_id ? Number(parent_id) : null,
    });
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    next(err);
  }
};

// 게시글 좋아요/취소 토글
export const toggleCommunityLike = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const postId = Number(req.params.id);
    const user_uuid = (req as any).user?.uuid;
    if (!user_uuid) {
      res.status(401).json({ message: "로그인 필요" });
      return;
    }
    const uuidBuffer = Buffer.from(user_uuid, "hex");
    // 좋아요 상태 토글하고 결과를 받음
    const isLiked = await communityService.toggleLike(uuidBuffer, "post", postId);
    const likes = await communityService.getCommunityLikesCount(postId); // <- 좋아요 수도 같이 응답
    res.json({ isLiked, likes, message: isLiked ? "좋아요" : "좋아요 취소" });
  } catch (err) {
    next(err);
  }
};


// 댓글 좋아요/취소
export const toggleCommentLike = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const commentId = Number(req.params.id);
    const user_uuid = (req as any).user?.uuid;
    if (!user_uuid) {
    res.status(401).json({ message: "로그인 필요" });
    return;
    }

    const uuidBuffer = Buffer.from(user_uuid, "hex");
    const isLike = req.method === "POST";
    await communityService.toggleLike(uuidBuffer, "community_comment", commentId);
    res.json({ message: isLike ? "댓글 좋아요 완료" : "댓글 좋아요 취소" });
  } catch (err) {
    next(err);
  }
};

// 대댓글 좋아요/취소
export const toggleReplyLike = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const replyId = Number(req.params.id);
    const user_uuid = (req as any).user?.uuid;
    if (!user_uuid) {
    res.status(401).json({ message: "로그인 필요" });
    return;
    }

    const uuidBuffer = Buffer.from(user_uuid, "hex");
    const isLike = req.method === "POST";
    await communityService.toggleLike(uuidBuffer, "asset_comment", replyId);
    res.json({ message: isLike ? "대댓글 좋아요 완료" : "대댓글 좋아요 취소" });
  } catch (err) {
    next(err);
  }
};


// 게시글 삭제
export const deleteCommunityPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const postId = Number(req.params.id);
    const user_uuid = (req as any).user?.uuid;
    if (!user_uuid) {
      res.status(401).json({ message: "로그인 필요" });
      return;
    }
    // 1. 해당 게시글의 작성자 uuid 가져오기
    const post = await communityService.getCommunityPost(postId);
    if (!post) {
      res.status(404).json({ message: "게시글 없음" });
      return;
    }
    if (Buffer.from(user_uuid, "hex").toString("hex") !== post.uuid.toString("hex")) {
      // 작성자가 아님
      res.status(403).json({ message: "작성자가 아닙니다." });
      return;
    }
    // 2. 삭제 쿼리 실행
    await communityService.deleteCommunityPost(postId);
    res.json({ message: "게시글 삭제 완료" });
  } catch (err) {
    next(err);
  }
};
