import pool from "../config/db";
import { RowDataPacket, OkPacket } from "mysql2/promise";

export interface DismissedNotificationModelRow {
  assetId: number;
  threshold: number;
}

/**
 * 사용자가 오늘 날짜에 닫은 알림 (assetId, threshold) 목록을 조회
 */
export async function fetchDismissedNotificationsModel(
  userUuidHex: string,
): Promise<DismissedNotificationModelRow[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       asset_id   AS assetId,
       threshold
     FROM user_dismissed_notifications
    WHERE user_uuid = ?
      AND DATE(dismissed_at) = CURDATE()`,
    [Buffer.from(userUuidHex, "hex")],
  );
  return (rows as any[]).map((r) => ({ assetId: r.assetId, threshold: r.threshold }));
}

/**
 * 특정 assetId, threshold 조합에 대해 "닫기" 기록
 */
export async function dismissNotificationModel(
  userUuidHex: string,
  assetId: number,
  threshold: number,
): Promise<void> {
  await pool.execute<OkPacket>(
    `INSERT IGNORE INTO user_dismissed_notifications
       (user_uuid, asset_id, threshold)
     VALUES (?, ?, ?)`,
    [Buffer.from(userUuidHex, "hex"), assetId, threshold],
  );
}
