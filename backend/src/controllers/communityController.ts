//backend/src/controllers/communityController.ts
import { Request, Response, NextFunction } from "express";
import * as communityService from "../services/communityService";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// 게시글 목록 조회
export async function getCommunityPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const posts = await communityService.getCommunityPosts();
    res.json(posts); // 배열로 반환
    // 또는 res.json({ posts });  → 프론트 구조에 따라 맞춤
  } catch (err) {
    next(err);
  }
}


// 게시글 상세 조회
export async function getCommunityPost(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ message: "커뮤니티 상세" });
  } catch (err) {
    next(err);
  }
}

// 게시글 등록
export async function createCommunityPost(req: MulterRequest, res: Response, next: NextFunction) {
  try {
    const { assets_id, uuid, community_title, community_contents, category } = req.body;
    const community_img = req.file ? req.file.buffer : null;

    if (!assets_id || !uuid || !community_title || !community_contents || !category) {
      res.status(400).json({ message: "필수값 누락" });
      return;
    }

    // uuid 변환 (string → Buffer)
    const uuidBuffer = Buffer.from(uuid.replace(/-/g, ''), 'hex');

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

    res.status(201).json({ message: "게시글 등록 완료", id: result.insertId });
  } catch (err) {
    next(err);
  }
}


// 게시글 수정
export async function updateCommunityPost(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ message: "게시글 수정" });
  } catch (err) {
    next(err);
  }
}

// 게시글 삭제
export async function deleteCommunityPost(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ message: "게시글 삭제" });
  } catch (err) {
    next(err);
  }
}
