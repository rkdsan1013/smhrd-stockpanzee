import type { RowDataPacket } from "mysql2/promise";
import pool from "../config/db";
import { SELECT_ALL_ASSETS, UPSERT_ASSET_INFO } from "./assetQueries";

/**
 * Asset + AssetInfo join 결과 타입
 */
export interface Asset extends RowDataPacket {
  id: number;
  symbol: string;
  name: string;
  market: string;
  current_price: number | null;
  price_change: number | null;
  market_cap: number | null;
  created_at: Date;
  updated_at: Date;
}

/** 전체 자산 조회 */
export async function findAllAssets(): Promise<Asset[]> {
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_ALL_ASSETS);
  return rows as Asset[];
}

/** asset_info upsert */
export async function upsertAssetInfo(
  assetId: number,
  currentPrice: number,
  priceChange: number,
  marketCap: number,
): Promise<void> {
  await pool.execute(UPSERT_ASSET_INFO, [assetId, currentPrice, priceChange, marketCap]);
}
