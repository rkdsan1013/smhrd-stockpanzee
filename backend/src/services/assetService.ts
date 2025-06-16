// /backend/src/services/assetService.ts
import * as model from "../models/assetModel";
import type { Asset } from "../models/assetModel";

export async function listAssets(): Promise<Asset[]> {
  return model.findAllAssets();
}
