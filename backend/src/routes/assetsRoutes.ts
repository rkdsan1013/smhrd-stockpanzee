// /backend/src/routes/assetsRoutes.ts
import express from "express";
import * as ctrl from "../controllers/assetController";

const router = express.Router();

// 전체 자산 목록 (메타데이터)
// GET /api/assets
router.get("/", ctrl.listAssets);

// 가격 정보만 조회
// GET /api/assets/prices
router.get("/prices", ctrl.listAssetPrices);

// 단일 자산 조회
// GET /api/assets/:id
router.get("/:id", ctrl.getAssetById);

export default router;
