// /backend/src/models/assetModel.ts
import type { RowDataPacket } from "mysql2/promise";
import pool from "../config/db";
import { SELECT_ALL_ASSETS, SELECT_CRYPTO_ASSETS } from "./assetQueries";

/** Asset 모델 정의 */
export interface Asset extends RowDataPacket {
  id: number;
  symbol: string;
  name: string;
  market: string;
  created_at: Date;
  updated_at: Date;
}

/** 전체 자산 조회 함수 */
export async function findAllAssets(): Promise<Asset[]> {
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_ALL_ASSETS);
  return rows as Asset[];
}

/** Binance 시장 자산만 조회하는 함수 */
export async function findCryptoAssets(): Promise<Asset[]> {
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_CRYPTO_ASSETS);
  return rows as Asset[];
}