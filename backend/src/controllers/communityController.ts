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
  next: NextFunction
): Promise<void> => {
  try {
    const posts = await communityService.getCommunityPosts();
    res.json(posts);
  } catch (err) {
    next(err);
  }
};

// 게시글 상세 조회
export const getCommunityPost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "잘못된 게시글 id" });
      return;
    }

    const post = await communityService.getCommunityPost(id);
    if (!post) {
      res.status(404).json({ message: "게시글을 찾을 수 없습니다" });
      return;
    }

    if (post.community_img) {
      post.community_img = post.community_img.toString("base64");
    }

    const user_uuid = (req as any).user?.uuid;
    let isLiked = false;
    if (user_uuid) {
      isLiked = await communityService.isPostLikedByUser(
        id,
        Buffer.from(user_uuid, "hex")
      );
    }

    const community_likes = await communityService.getCommunityLikesCount(id);
    res.json({ ...post, community_likes, isLiked });
  } catch (err) {
    next(err);
  }
};

// 게시글 등록
export const createCommunityPost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const r = req as MulterRequest;

  try {
    const {
      assets_id,
      uuid,
      community_title,
      community_contents,
      category,
    } = r.body;
    const community_img = r.file?.buffer ?? null;

    if (
      !assets_id ||
      !uuid ||
      !community_title ||
      !community_contents ||
      !category
    ) {
      res.status(400).json({ message: "필수값 누락" });
      return;
    }

    const uuidBuffer = Buffer.from(uuid.replace(/-/g, ""), "hex");
    const result = await communityService.createCommunityPost({
      assets_id: Number(assets_id),
      uuid: uuidBuffer,
      community_title,
      community_contents,
      category,
      community_img,
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
  next: NextFunction
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
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const user_uuid = (req as any).user?.uuid;
    if (!user_uuid) {
      res.status(401).json({ message: "로그인 필요" });
      return;
    }

    await communityService.likeCommunityPost(
      id,
      Buffer.from(user_uuid, "hex")
    );
    res.json({ message: "좋아요 완료" });
  } catch (err) {
    next(err);
  }
};

// 게시글 좋아요 취소
export const unlikeCommunityPost = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    const user_uuid = (req as any).user?.uuid;
    if (!user_uuid) {
      res.status(401).json({ message: "로그인 필요" });
      return;
    }

    await communityService.unlikeCommunityPost(
      id,
      Buffer.from(user_uuid, "hex")
    );
    res.json({ message: "좋아요 취소" });
  } catch (err) {
    next(err);
  }
};