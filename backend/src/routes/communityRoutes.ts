// /backend/src/routes/communityRoutes.ts
import { Router } from "express";
import * as communityController from "../controllers/communityController";
import multer from "multer";
import { authenticate } from "../middlewares/auth";
import * as commentController from "../controllers/commentController";

const upload = multer();
const router = Router();

// 커뮤니티 전체보기
router.get("/", communityController.getCommunityPosts);

// 커뮤니티 상세보기
router.get("/:id", communityController.getCommunityPost);

// 커뮤니티 글 작성
router.post("/", authenticate, communityController.createCommunityPost);

// 커뮤니티 글 수정
router.put("/:id", communityController.updateCommunityPost);

// 커뮤니티 글 삭제
router.delete("/:id", authenticate, communityController.deleteCommunityPost);


// 댓글 라우트
router.get("/:id/comments", communityController.getComments);
router.post("/:id/comments", upload.single("image"), communityController.createComment);

// 게시글 좋아요
router.post("/:id/like", authenticate, communityController.toggleCommunityLike);
router.delete("/:id/like", authenticate, communityController.toggleCommunityLike);

// 댓글 좋아요
router.post("/comments/:id/like", authenticate, communityController.toggleCommentLike);
router.delete("/comments/:id/like", authenticate, communityController.toggleCommentLike);

// 대댓글 좋아요
router.post("/replies/:id/like", authenticate, communityController.toggleReplyLike);
router.delete("/replies/:id/like", authenticate, communityController.toggleReplyLike);

// 댓글 수정
router.put(  "/comments/:id",  authenticate,  commentController.updateComment);

// 댓글 삭제
router.delete(  "/comments/:id",  authenticate,  commentController.deleteComment);


router.get("/:id/comments", communityController.getComments);
router.post("/:id/comments", authenticate, upload.none(), communityController.createComment);

export default router;
