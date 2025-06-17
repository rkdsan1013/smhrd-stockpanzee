// backend/src/routes/communityRoutes.ts
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

export default router;
