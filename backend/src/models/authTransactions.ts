// /backend/src/models/authTransactions.ts
import pool from "../config/db";
import { INSERT_USER, INSERT_USER_PROFILE } from "./authQueries";

/**
 * 사용자 가입 트랜잭션
 * 1) users 테이블에 기본 정보 저장
 * 2) user_profiles 테이블에 프로필 정보 저장
 */
export async function registerUserTransaction(
  userUuid: Buffer,
  email: string,
  hashedPassword: string,
  username: string,
  avatar_url?: string | null,
): Promise<void> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(INSERT_USER, [userUuid, email, hashedPassword]);
    await conn.query(INSERT_USER_PROFILE, [userUuid, username, avatar_url ?? null]);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
