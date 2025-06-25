// /backend/src/models/assetModel.ts

import type { RowDataPacket } from "mysql2/promise";
import pool from "../config/db";
import {
  SELECT_ALL_ASSETS,
  UPSERT_ASSET_INFO,
  GET_ASSET_BY_SYMBOL_AND_MARKET,
  SELECT_CRYPTO_ASSETS,
  UPSERT_CRYPTO_INFO,
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


/** 암호화폐 전용 타입 (coin_id: LOWER(name)) */
export interface CryptoAsset extends RowDataPacket {
  id: number;
  symbol: string;
  coin_id: string;
}

/** 전체 자산 + info */
export async function findAllAssets(): Promise<Asset[]> {
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_ALL_ASSETS);
  return rows as Asset[];
}

/** 일반 자산 price·change·cap upsert */
export async function upsertAssetInfo(
  assetId: number,
  currentPrice: number,
  priceChange: number,
  marketCap: number,
): Promise<void> {
  await pool.execute(UPSERT_ASSET_INFO, [assetId, currentPrice, priceChange, marketCap]);
}

/** 암호화폐 전용 price·change·cap upsert */
export async function upsertCryptoInfo(
  assetId: number,
  currentPrice: number,
  priceChange: number,
  marketCap: number,
): Promise<void> {
  await pool.execute(UPSERT_CRYPTO_INFO, [assetId, currentPrice, priceChange, marketCap]);
}

/** symbol+market 으로 자산 조회 */
export async function getAssetBySymbolAndMarket(
  symbol: string,
  market: string,
): Promise<Asset | null> {
  const [rows] = await pool.query<RowDataPacket[]>(GET_ASSET_BY_SYMBOL_AND_MARKET, [
    symbol,
    market,
  ]);
  const assets = rows as Asset[];
  return assets.length > 0 ? assets[0] : null;
}

/** Binance 시장 자산만, coin_id 포함해서 조회 */
export async function findCryptoAssets(): Promise<CryptoAsset[]> {
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_CRYPTO_ASSETS);
  return rows as CryptoAsset[];
}

//자산 종목 정보
export async function findAssetWithInfoById(assetId: number) {
  const [rows] = await pool.query(
    `SELECT a.id, a.symbol, a.name, a.market, ai.current_price, ai.price_change
     FROM assets a
     LEFT JOIN asset_info ai ON a.id = ai.asset_id
     WHERE a.id = ?`, [assetId]
  );
  if ((rows as any[]).length === 0) return null;
  return (rows as any[])[0]; // id 포함
}
