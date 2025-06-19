// /backend/src/routes/assetsRoutes.ts
import express from "express";
import * as ctrl from "../controllers/assetController";

const router = express.Router();

// 전체 자산 목록
// GET /api/assets
router.get("/", ctrl.listAssets);

// 단일 자산 조회
// GET /api/assets/:id
router.get("/:id", ctrl.getAssetById);

export default router;
