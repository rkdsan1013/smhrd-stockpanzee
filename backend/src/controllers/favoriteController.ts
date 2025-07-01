// /backend/src/controllers/favoriteController.ts
import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as favService from "../services/favoriteService";

export async function getFavorites(req: AuthRequest, res: Response): Promise<void> {
  const uuidHex = req.user?.uuid as string;
  if (!uuidHex) {
    res.status(401).json({ message: "유효한 사용자 정보가 없습니다." });
    return; // ← 여기서 void 반환
  }

  const favorites = await favService.fetchFavorites(uuidHex);
  res.json({ favorites });
}

export async function addFavorite(req: AuthRequest, res: Response): Promise<void> {
  const uuidHex = req.user?.uuid as string;
  if (!uuidHex) {
    res.status(401).json({ message: "유효한 사용자 정보가 없습니다." });
    return; // ← void 반환
  }

  const assetId = Number(req.params.assetId);
  await favService.addFavorite(uuidHex, assetId);
  res.status(201).end();
}

export async function removeFavorite(req: AuthRequest, res: Response): Promise<void> {
  const uuidHex = req.user?.uuid as string;
  if (!uuidHex) {
    res.status(401).json({ message: "유효한 사용자 정보가 없습니다." });
    return; // ← void 반환
  }

  const assetId = Number(req.params.assetId);
  await favService.removeFavorite(uuidHex, assetId);
  res.status(204).end();
}
