// /backend/src/routes/community.ts
import { Router } from "express";
import * as communityController from "../controllers/communityController";
import multer from "multer";

const upload = multer();
const router = Router();

router.get("/", communityController.getCommunityPosts);
router.get("/:id", communityController.getCommunityPost);
router.post("/", upload.single("image"), communityController.createCommunityPost);
router.put("/:id", communityController.updateCommunityPost);
router.delete("/:id", communityController.deleteCommunityPost);

// 좋아요 추가
router.post("/:id/like", communityController.likeCommunityPost);
// 좋아요 취소
router.delete("/:id/like", communityController.unlikeCommunityPost);

// 댓글 라우트
router.get("/:id/comments", communityController.getComments);
router.post("/:id/comments", upload.single("image"), communityController.createComment);

// 댓글 좋아요
router.post("/comments/:id/like", communityController.likeComment);
router.delete("/comments/:id/like", communityController.unlikeComment);

// 대댓글 좋아요 (id는 reply id)
router.post("/replies/:id/like", communityController.likeReply);
router.delete("/replies/:id/like", communityController.unlikeReply);

export default router;
