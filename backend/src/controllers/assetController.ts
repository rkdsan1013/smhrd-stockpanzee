// /backend/src/controllers/assetController.ts
import { RequestHandler } from "express";
import * as service from "../services/assetService";

/**
 * 전체 자산 목록 조회 (메타데이터)
 * GET /api/assets
 */
export const listAssets: RequestHandler = async (req, res, next) => {
  try {
    const assets = await service.listAssets();
    res.json(assets);
  } catch (err) {
    next(err);
  }
};

/**
 * 가격 정보만 조회
 * GET /api/assets/prices
 */
export const listAssetPrices: RequestHandler = async (req, res, next) => {
  try {
    const prices = await service.listAssetPrices();
    res.json(prices);
  } catch (err) {
    next(err);
  }
};

/**
 * 단일 자산 조회
 * GET /api/assets/:id
 */
export const getAssetById: RequestHandler = async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const asset = await service.getAssetById(id);
    if (!asset) {
      res.status(404).json({ message: "Asset not found" });
      return;
    }
    res.json(asset);
  } catch (err) {
    next(err);
  }
};
