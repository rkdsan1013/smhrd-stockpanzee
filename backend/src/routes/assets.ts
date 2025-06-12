import express from "express";
import * as ctrl from "../controllers/assetController";

const router = express.Router();

// 자산 목록 조회
// GET /api/assets
router.get("/", ctrl.listAssets);

export default router;
