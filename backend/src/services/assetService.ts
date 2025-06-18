// /backend/src/services/assetService.ts
import * as model from "../models/assetModel";
import type { Asset } from "../models/assetModel";
import { getPriceFromMemory } from "./polygonPriceStream";

export interface AssetWithPrice extends Asset {
  currentPrice: number;
  priceChange: number;
  marketCap: number;
}

/**
 * DB + 메모리 캐시를 병합해 자산 정보를 반환
 */
export async function listAssets(): Promise<AssetWithPrice[]> {
  const assets = await model.findAllAssets();

  return assets.map((a) => {
    const memory = getPriceFromMemory(a.symbol);
    const dbPrice = a.current_price ?? 0;

    if (memory) {
      const cp = memory.price;
      const pc = dbPrice
        ? Number((((cp - dbPrice) / dbPrice) * 100).toFixed(2))
        : (a.price_change ?? 0);
      const mc = dbPrice
        ? Number(((cp / dbPrice) * (a.market_cap ?? 0)).toFixed(2))
        : (a.market_cap ?? 0);
      return { ...a, currentPrice: cp, priceChange: pc, marketCap: mc };
    }

    return {
      ...a,
      currentPrice: dbPrice,
      priceChange: a.price_change ?? 0,
      marketCap: a.market_cap ?? 0,
    };
  });
}
