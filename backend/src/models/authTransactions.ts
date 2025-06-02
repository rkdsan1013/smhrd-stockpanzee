// /backend/src/models/authTransactions.ts
import pool from "../config/db";
import { INSERT_USER, INSERT_USER_PROFILE } from "./authQueries";

/**
 * 회원가입 시 users와 user_profiles 테이블에 데이터를 삽입하는 트랜잭션
 */
export async function registerUserTransaction(
  userUuidBuffer: Buffer,
  email: string,
  hashedPassword: string,
  username: string,
): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(INSERT_USER, [userUuidBuffer, email, hashedPassword]);
    await connection.query(INSERT_USER_PROFILE, [userUuidBuffer, username]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
