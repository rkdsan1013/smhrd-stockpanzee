import { Request, Response, NextFunction } from "express";
import * as communityService from "../services/communityService";
import * as communityModel from "../models/communityModel";
import pool from "../config/db";
import * as commentService from "../services/commentService";
import fs from "fs";
import path from "path";


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
    const uuid = (r as any).user?.uuid;

    if (!uuid || !community_title || !community_contents || !category) {
      res.status(400).json({ message: "필수값 누락" });
      return;
    }

    const uuidBuffer = Buffer.from(uuid.replace(/-/g, ""), "hex");
    const img_url: string | undefined = r.file ? `/uploads/img/${r.file.filename}` : undefined;

    const result = await communityService.createCommunityPost({
      uuid: uuidBuffer,
      community_title,
      community_contents,
      category,
      img_url,
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
  const r = req as MulterRequest;
  try {
    const id = Number(req.params.id);
    const { community_title, community_contents, category } = r.body;

    // 기존 게시글 조회 (이미지 변경시 기존 파일 삭제)
    const [rows]: any = await pool.query(`SELECT img_url FROM community WHERE id=?`, [id]);
    const oldImgUrl = rows?.[0]?.img_url;

    let img_url = oldImgUrl;
    if (r.file) {
      img_url = `/uploads/img/${r.file.filename}`;
      // 기존 이미지 삭제
      if (oldImgUrl) {
        let relPath = oldImgUrl;
        if (relPath.startsWith('/')) relPath = relPath.slice(1);
        const filePath = path.join(__dirname, "../../", relPath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await communityService.updateCommunityPost(id, {
      community_title,
      community_contents,
      category,
      img_url,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// 댓글 가져오기
export const getComments = async (
  req: Request, res: Response, next: NextFunction
) => {
  try {
    const comm_id = Number(req.params.id);
    const user_uuid = (req as any).user?.uuid
      ? Buffer.from((req as any).user.uuid, "hex")
      : undefined;
    const comments = await commentService.getComments(comm_id, user_uuid);
    res.json(comments);
  } catch (err) { next(err); }
};


// 댓글 등록 (parent_id는 대댓글일 때만 넘어옴)
// 댓글 등록 (이미지 포함)
export const createComment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const uuid = (req as any).user?.uuid;
    const content = req.body.content;
    const parent_id = req.body.parent_id ? Number(req.body.parent_id) : undefined;
    const comm_id = Number(req.params.id);

    // ⭐️ 파일 저장시 경로 저장 (없으면 undefined)
    const img_url = (req as MulterRequest).file
      ? `/uploads/img/${(req as MulterRequest).file?.filename}`
      : undefined;

    // 디버깅용 콘솔
    console.log("⭐️ [CREATE COMMENT]", {
      uuid,
      content,
      parent_id,
      comm_id,
      img_url,
    });

    if (!uuid || !content) {
      res.status(400).json({ message: "필수값 누락" });
      return;
    }

    const uuidBuffer = Buffer.from(uuid.replace(/-/g, ""), "hex");
    const result = await communityService.createComment({
      uuid: uuidBuffer,
      target_type: "community",
      target_id: comm_id,
      parent_id,
      content,
      img_url, // 저장!
    });

    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error("🚨 [CREATE COMMENT ERROR]", err);
    next(err);
  }
};




export const updateComment = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const uuid = (req as any).user?.uuid;
    const id = Number(req.params.id); // params.commentId → params.id로 통일
    const content = req.body.content;
    if (!uuid || !content) {
      res.status(400).json({ message: "필수값 누락" });
      return;
    }
    await communityService.updateComment(id, content, Buffer.from(uuid.replace(/-/g, ""), "hex"));
    res.json({ message: "수정 성공" });
  } catch (err) {
    next(err);
  }
};

// 댓글 삭제 (commentController.ts)

export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const commentId = Number(req.params.id);

    // 1. 삭제할 댓글/대댓글의 img_url을 모두 조회
    const [rows]: any = await pool.query(
      `SELECT img_url FROM community_com WHERE (id=? OR parent_id=?) AND img_url IS NOT NULL`,
      [commentId, commentId]
    );

    // 2. 파일 시스템에서 이미지 삭제
    for (const row of rows) {
      if (row.img_url) {
        let relPath = row.img_url;
        if (relPath.startsWith('/')) relPath = relPath.slice(1); // 슬래시 삭제
        const filePath = path.join(__dirname, "../../", relPath);
        console.log("[파일 삭제 시도]", filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("[삭제됨]", filePath);
        } else {
          console.log("[존재하지 않음]", filePath);
        }
      }
    }

    // 3. DB에서 댓글/대댓글 삭제
    await commentService.deleteComment(commentId);

    res.json({ message: "댓글(및 대댓글, 이미지) 삭제 완료" });
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
    const likes = await communityService.getCommunityLikesCount(postId);
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
    console.log(`[BACKEND 댓글 좋아요] commentId=${commentId}, uuid=${user_uuid}, method=${req.method}`);

    await communityService.toggleLike(uuidBuffer, "community_comment", commentId);
    res.json({ message: isLike ? "댓글 좋아요 완료" : "댓글 좋아요 취소" });
  } catch (err) {
    next(err);
  }
};

// 대댓글 좋아요/취소 (실제로는 별도 처리 필요할 수 있음)
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
    const post = await communityService.getCommunityPost(postId);
    if (!post) {
      res.status(404).json({ message: "게시글 없음" });
      return;
    }
    if (Buffer.from(user_uuid, "hex").toString("hex") !== post.uuid.toString("hex")) {
      res.status(403).json({ message: "작성자가 아닙니다." });
      return;
    }
    await communityService.deleteCommunityPost(postId);
    res.json({ message: "게시글 삭제 완료" });
  } catch (err) {
    next(err);
  }
};
