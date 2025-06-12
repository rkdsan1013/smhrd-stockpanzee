import { Request, Response, NextFunction } from "express";
import * as service from "../services/assetService";

// GET /api/assets
export async function listAssets(req: Request, res: Response, next: NextFunction) {
  try {
    const assets = await service.listAssets();
    res.json(assets);
  } catch (err) {
    next(err);
  }
}
