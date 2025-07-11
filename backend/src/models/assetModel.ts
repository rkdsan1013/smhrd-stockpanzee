// /backend/src/models/assetModel.ts

import type { RowDataPacket } from "mysql2/promise";
import pool from "../config/db";
import {
  SELECT_ALL_ASSETS,
  SELECT_ASSET_PRICES,
  UPSERT_ASSET_INFO,
  UPSERT_CRYPTO_INFO,
  GET_ASSET_BY_SYMBOL_AND_MARKET,
  SELECT_CRYPTO_ASSETS,
  SELECT_STOCK_ASSETS,
} from "./assetQueries";

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

export interface AssetPriceRow extends RowDataPacket {
  id: number;
  current_price: number | null;
  price_change: number | null;
}

export async function findAllAssets(): Promise<Asset[]> {
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_ALL_ASSETS);
  return rows as Asset[];
}

/**
 * 가격 정보만 조회 (listAssetPrices용)
 */
export async function findAllAssetPrices(): Promise<AssetPriceRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_ASSET_PRICES);
  return rows as AssetPriceRow[];
}

export async function upsertAssetInfo(
  assetId: number,
  currentPriceKrw: number,
  priceChange: number,
  marketCapKrw: number,
): Promise<void> {
  await pool.execute(UPSERT_ASSET_INFO, [assetId, currentPriceKrw, priceChange, marketCapKrw]);
}

export async function upsertCryptoInfo(
  assetId: number,
  currentPriceKrw: number,
  priceChange: number,
  marketCapKrw: number,
): Promise<void> {
  await pool.execute(UPSERT_CRYPTO_INFO, [assetId, currentPriceKrw, priceChange, marketCapKrw]);
}

export async function getAssetBySymbolAndMarket(
  symbol: string,
  market: string,
): Promise<Asset | null> {
  const [rows] = await pool.query<RowDataPacket[]>(GET_ASSET_BY_SYMBOL_AND_MARKET, [
    symbol,
    market,
  ]);
  return (rows as Asset[])[0] || null;
}

export async function findCryptoAssets(): Promise<Asset[]> {
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_CRYPTO_ASSETS);
  return rows as Asset[];
}

export async function findStockAssets(): Promise<Asset[]> {
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_STOCK_ASSETS);
  return rows as Asset[];
}

export async function findAssetWithInfoById(assetId: number): Promise<{
  id: number;
  symbol: string;
  name: string;
  market: string;
  current_price: number | null;
  price_change: number | null;
} | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       a.id,
       a.symbol,
       a.name,
       a.market,
       ai.current_price,
       ai.price_change
     FROM assets a
     LEFT JOIN asset_info ai ON ai.asset_id = a.id
     WHERE a.id = ?`,
    [assetId],
  );
  return (rows as any[])[0] || null;
}
