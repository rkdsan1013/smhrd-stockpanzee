import { Router } from "express";
import * as communityController from "../controllers/communityController";
import multer from "multer";
import { authenticate } from "../middlewares/authenticate";

const upload = multer();
const router = Router();

router.get("/", communityController.getCommunityPosts);
router.get("/:id", communityController.getCommunityPost);
router.post(
  "/",
  upload.single("image"),
  communityController.createCommunityPost
);
router.put("/:id", communityController.updateCommunityPost);
router.delete("/:id", communityController.deleteCommunityPost);

// 좋아요 추가
router.post(
  "/:id/like",
  communityController.likeCommunityPost
);
// 좋아요 취소
router.delete(
  "/:id/like",
  communityController.unlikeCommunityPost
);

export default router;
