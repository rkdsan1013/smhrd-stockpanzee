// /backend/src/controllers/communityController.ts
import { Request, Response, NextFunction } from "express";
import * as communityService from "../services/communityService";

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

// 게시글 상세 조회 (조회수 1 증가)
export const getCommunityPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "잘못된 게시글 id" });
      return;
    }

    // ★ 1. 조회수 1 증가 (DB에서 +1)
    await communityService.incrementCommunityViews(id);

    // ★ 2. 최신 데이터 select (반드시 await)
    const post = await communityService.getCommunityPost(id);

    if (!post) {
      res.status(404).json({ message: "게시글을 찾을 수 없습니다" });
      return;
    }

    // 이미지 BLOB → base64 변환
    if (post.community_img) {
      post.community_img = post.community_img.toString("base64");
    }

    // 로그인된 사용자라면 좋아요 체크
    const user_uuid = (req as any).user?.uuid;
    let isLiked = false;
    if (user_uuid) {
      isLiked = await communityService.isPostLikedByUser(id, Buffer.from(user_uuid, "hex"));
    }
    // 좋아요 개수
    const community_likes = await communityService.getCommunityLikesCount(id);

    // 모든 정보 통합해서 응답
    res.json({
      ...post,
      community_likes,
      isLiked,
    });
  } catch (err) {
    next(err);
  }
};

// 게시글 등록 (assets_id, image 없이)
export const createCommunityPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { uuid, community_title, community_contents, category } = req.body;

    // 필수값 체크
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
  next: NextFunction,
): Promise<void> => {
  try {
    // TODO: 실제 업데이트 로직 구현
    res.json({ message: "게시글 수정" });
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
    // TODO: 실제 삭제 로직 구현
    res.json({ message: "게시글 삭제" });
  } catch (err) {
    next(err);
  }
};

// 게시글 좋아요
export const likeCommunityPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const user_uuid = (req as any).user?.uuid;
    if (!user_uuid) {
      res.status(401).json({ message: "로그인 필요" });
      return;
    }

    await communityService.likeCommunityPost(id, Buffer.from(user_uuid, "hex"));
    res.json({ message: "좋아요 완료" });
  } catch (err) {
    next(err);
  }
};

// 게시글 좋아요 취소
export const unlikeCommunityPost = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const user_uuid = (req as any).user?.uuid;
    if (!user_uuid) {
      res.status(401).json({ message: "로그인 필요" });
      return;
    }

    await communityService.unlikeCommunityPost(id, Buffer.from(user_uuid, "hex"));
    res.json({ message: "좋아요 취소" });
  } catch (err) {
    next(err);
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

// 댓글 좋아요
export const likeComment = async (
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
    await communityService.likeComment(commentId, Buffer.from(user_uuid, "hex"));
    res.json({ message: "댓글 좋아요 완료" });
  } catch (err) {
    next(err);
  }
};

export const unlikeComment = async (
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
    await communityService.unlikeComment(commentId, Buffer.from(user_uuid, "hex"));
    res.json({ message: "댓글 좋아요 취소" });
  } catch (err) {
    next(err);
  }
};
// 대댓글 좋아요 (댓글과 구조는 똑같이 동작)
export const likeReply = likeComment;
export const unlikeReply = unlikeComment;
