// backend/src/controllers/communityController.ts
import { Request, Response, NextFunction, RequestHandler } from "express"
import * as communityService from "../services/communityService"

// multer 적용 시에만 req.file을 쓰기 위한 확장 인터페이스
export interface MulterRequest extends Request {
  file?: Express.Multer.File
}

// ───────────────────────────────────────────────────────────────
// 게시글 목록 조회
export const getCommunityPosts: RequestHandler = async (
  req,
  res,
  next
): Promise<void> => {
  try {
    const posts = await communityService.getCommunityPosts()
    res.json(posts)
  } catch (err) {
    next(err)
  }
}

// 게시글 상세 조회
export const getCommunityPost: RequestHandler = async (
  req,
  res,
  next
): Promise<void> => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) {
      res.status(400).json({ message: "잘못된 게시글 id" })
      return
    }

    const post = await communityService.getCommunityPost(id)
    if (!post) {
      res.status(404).json({ message: "게시글을 찾을 수 없습니다" })
      return
    }

    // BLOB 이미지가 있으면 Base64로 인코딩
    if (post.community_img) {
      post.community_img = post.community_img.toString("base64")
    }

    res.json(post)
  } catch (err) {
    next(err)
  }
}

// 게시글 등록
export const createCommunityPost: RequestHandler = async (
  req,
  res,
  next
): Promise<void> => {
  // MulterRequest로 타입 단언
  const r = req as MulterRequest

  try {
    const { assets_id, uuid, community_title, community_contents, category } =
      r.body
    const community_img = r.file?.buffer ?? null

    if (
      !assets_id ||
      !uuid ||
      !community_title ||
      !community_contents ||
      !category
    ) {
      res.status(400).json({ message: "필수값 누락" })
      return
    }

    // UUID 문자열 → Buffer
    const uuidBuffer = Buffer.from(uuid.replace(/-/g, ""), "hex")

    const result = await communityService.createCommunityPost({
      assets_id: Number(assets_id),
      uuid: uuidBuffer,
      community_title,
      community_contents,
      category,
      community_img,
    })

    if (!result.insertId) {
      res.status(500).json({ message: "DB 저장 실패" })
      return
    }

    res.status(201).json({ message: "게시글 등록 완료", id: result.insertId })
  } catch (err) {
    next(err)
  }
}

// 게시글 수정
export const updateCommunityPost: RequestHandler = async (
  req,
  res,
  next
): Promise<void> => {
  try {
    // TODO: 실제 업데이트 로직 구현
    res.json({ message: "게시글 수정" })
  } catch (err) {
    next(err)
  }
}

// 게시글 삭제
export const deleteCommunityPost: RequestHandler = async (
  req,
  res,
  next
): Promise<void> => {
  try {
    // TODO: 실제 삭제 로직 구현
    res.json({ message: "게시글 삭제" })
  } catch (err) {
    next(err)
  }
}
