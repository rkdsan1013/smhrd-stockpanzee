import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import pool from "../config/db";

export interface Asset {
  id: number;
  symbol: string;
  name: string;
  market: string;
  created_at: Date;
  updated_at: Date;
}

// 전체 자산 조회
export async function findAllAssets(): Promise<Asset[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, symbol, name, market, created_at, updated_at
     FROM assets
     ORDER BY id`,
  );
  return rows as Asset[];
}
