// /backend/src/models/assetModel.ts
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

// ─── 모든 자산 공통 타입 ─────────────────────────────────────────────────────
export interface Asset extends RowDataPacket {
  id: number;
  symbol: string;
  name: string;
  market: string;
  // KRW 기준 현재가
  current_price: number | null;
  // 24h 변동률 (%)
  price_change: number | null;
  // KRW 시가총액
  market_cap: number | null;
  created_at: Date;
  updated_at: Date;
}

// ─── 암호화폐 전용 타입 ─────────────────────────────────────────────────────
export interface CryptoAsset extends RowDataPacket {
  id: number;
  symbol: string;
  // asset.name 을 LOWER() 한 값
  coin_id: string;
}

// ─── 전체 자산 조회 ─────────────────────────────────────────────────────────
export async function findAllAssets(): Promise<Asset[]> {
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_ALL_ASSETS);
  return rows as Asset[];
}

// ─── 일반 자산 KRW upsert ──────────────────────────────────────────────────
export async function upsertAssetInfo(
  assetId: number,
  currentPriceKrw: number,
  priceChange: number,
  marketCapKrw: number,
): Promise<void> {
  await pool.execute(UPSERT_ASSET_INFO, [assetId, currentPriceKrw, priceChange, marketCapKrw]);
}

// ─── 암호화폐 전용 KRW upsert ──────────────────────────────────────────────
export async function upsertCryptoInfo(
  assetId: number,
  currentPriceKrw: number,
  priceChange: number,
  marketCapKrw: number,
): Promise<void> {
  await pool.execute(UPSERT_CRYPTO_INFO, [assetId, currentPriceKrw, priceChange, marketCapKrw]);
}

// ─── symbol+market 으로 단일 자산 조회 ────────────────────────────────────
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

// ─── Binance 마켓(암호화폐) 자산만 조회 ────────────────────────────────────
export async function findCryptoAssets(): Promise<CryptoAsset[]> {
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_CRYPTO_ASSETS);
  return rows as CryptoAsset[];
}
