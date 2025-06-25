// /backend/src/models/assetTransactions.ts
import pool from "../config/db";
import { UPSERT_ASSET } from "./assetQueries";

/**
 * 자산을 업서트 방식으로 등록합니다.
 * 동일한 (symbol, name, market)가 이미 존재하면 업데이트하고,
 * 없으면 삽입합니다.
 */
export async function upsertAsset(symbol: string, name: string, market: string): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(UPSERT_ASSET, [symbol, name, market]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
