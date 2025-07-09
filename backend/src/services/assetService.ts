// /backend/src/services/assetService.ts
import * as model from "../models/assetModel";
import type { Asset } from "../models/assetModel";
import { getPriceFromMemory } from "./marketData/usStockMarketService";

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
      // 기존 dbPrice가 0이면 변동률과 시총을 0으로 처리
      const pc = dbPrice === 0 ? 0 : Number((((cp - dbPrice) / dbPrice) * 100).toFixed(2));
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
 * 가격 정보(현재가, 변동률)만 반환
 */
export async function listAssetPrices(): Promise<
  { id: number; currentPrice: number; priceChange: number }[]
> {
  const allAssets = await listAssets();
  return allAssets.map(({ id, currentPrice, priceChange }) => ({
    id,
    currentPrice,
    priceChange,
  }));
}

/**
 * 단일 자산 조회 (ID 기준)
 */
export async function getAssetById(id: number): Promise<AssetWithPrice | null> {
  const all = await listAssets();
  return all.find((a) => a.id === id) ?? null;
}
