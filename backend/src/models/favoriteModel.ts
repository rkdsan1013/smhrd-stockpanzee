// /backend/src/models/favoriteModel.ts
import pool from "../config/db";
import { SELECT_FAVORITES_BY_USER, INSERT_FAVORITE, DELETE_FAVORITE } from "./favoriteQueries";
import { RowDataPacket, OkPacket } from "mysql2/promise";

// hex string → Buffer 변환
function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex, "hex");
}

export async function fetchFavoritesModel(userUuidHex: string): Promise<number[]> {
  const buf = hexToBuffer(userUuidHex);
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_FAVORITES_BY_USER, [buf]);
  return rows.map((r) => r.asset_id);
}

export async function addFavoriteModel(userUuidHex: string, assetId: number): Promise<void> {
  const buf = hexToBuffer(userUuidHex);
  await pool.execute<OkPacket>(INSERT_FAVORITE, [buf, assetId]);
}

export async function removeFavoriteModel(userUuidHex: string, assetId: number): Promise<void> {
  const buf = hexToBuffer(userUuidHex);
  await pool.execute<OkPacket>(DELETE_FAVORITE, [buf, assetId]);
}
