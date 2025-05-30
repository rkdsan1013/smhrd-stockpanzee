// /backend/src/models/authModel.ts
import pool from "../config/db";
import { SELECT_USER_BY_EMAIL } from "./authQueries";
import { registerUserTransaction } from "./authTransactions";

/**
 * 이메일로 사용자를 조회합니다.
 */
export async function findUserByEmail(email: string): Promise<any[]> {
  const [rows] = await pool.query(SELECT_USER_BY_EMAIL, [email]);
  return rows as any[];
}

/**
 * 회원가입을 수행합니다.
 */
export async function registerUser(
  userUuidBuffer: Buffer,
  email: string,
  hashedPassword: string,
  username: string,
): Promise<void> {
  await registerUserTransaction(userUuidBuffer, email, hashedPassword, username);
}
