import pool from "../config/db";
import { RowDataPacket, OkPacket } from "mysql2/promise";

export async function fetchDismissedNotificationsModel(userUuidHex: string): Promise<number[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT asset_id FROM user_dismissed_notifications WHERE user_uuid = ?`,
    [Buffer.from(userUuidHex, "hex")],
  );
  return rows.map((r) => r.asset_id);
}

export async function dismissNotificationModel(
  userUuidHex: string,
  assetId: number,
): Promise<void> {
  await pool.execute<OkPacket>(
    `INSERT IGNORE INTO user_dismissed_notifications (user_uuid, asset_id) VALUES (?, ?)`,
    [Buffer.from(userUuidHex, "hex"), assetId],
  );
}
