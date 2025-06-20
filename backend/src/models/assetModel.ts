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

/** 암호화폐 전용 price·change upsert */
export async function upsertCryptoInfo(
  assetId: number,
  currentPrice: number,
  priceChange: number,
): Promise<void> {
  await pool.execute(UPSERT_CRYPTO_INFO, [assetId, currentPrice, priceChange]);
}

/** symbol+market 으로 자산 조회 */
export async function getAssetBySymbolAndMarket(
  symbol: string,
  market: string,
): Promise<Pick<Asset, "id" | "symbol" | "name" | "market"> | null> {
  const [rows] = await pool.query<RowDataPacket[]>(GET_ASSET_BY_SYMBOL_AND_MARKET, [
    symbol,
    market,
  ]);
  const assets = rows as Asset[];
  return assets.length > 0 ? assets[0] : null;
}

/** Binance 시장 자산만 조회하는 함수 */
export async function findCryptoAssets(): Promise<Asset[]> {
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_CRYPTO_ASSETS);
  return rows as Asset[];
}

export const findDomesticAssets = async (): Promise<{ name: string; symbol: string }[]> => {
  const [rows] = await pool.query(`
    SELECT name, symbol FROM assets WHERE market IN ('KOSPI', 'KOSDAQ')
  `);
  return rows as any[];
};
