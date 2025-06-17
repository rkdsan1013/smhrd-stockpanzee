// /backend/src/services/assetService.ts
import * as model from "../models/assetModel";
import type { Asset } from "../models/assetModel";
import { getPriceFromMemory } from "./polygonPriceStream";

export interface AssetWithPrice extends Asset {
  currentPrice: number;
  priceChange: number; // 아직 변동률 계산 안함 (0으로 채움)
  marketCap: number; // 아직 시가총액 계산 안함 (0으로 채움)
}

export async function listAssets(): Promise<AssetWithPrice[]> {
  const assets = await model.findAllAssets();

  const result: AssetWithPrice[] = assets.map((asset) => {
    const priceData = getPriceFromMemory(asset.symbol);
    return {
      ...asset,
      currentPrice: priceData?.price ?? 0,
      priceChange: 0,
      marketCap: 0,
    };
  });

  return result;
}
