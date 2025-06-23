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
      // 만약 기존 dbPrice가 0이면 변동률을 0으로 처리
      const pc = dbPrice === 0 ? 0 : Number((((cp - dbPrice) / dbPrice) * 100).toFixed(2));
      // dbPrice가 0일 경우 시총도 0으로 처리
      const mc = dbPrice === 0 ? 0 : Number(((cp / dbPrice) * (a.market_cap ?? 0)).toFixed(2));
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

/**
 * 단일 자산 조회 (ID 기준)
 */
export async function getAssetById(id: number): Promise<AssetWithPrice | null> {
  const all = await listAssets();
  return all.find((a) => a.id === id) ?? null;
}
