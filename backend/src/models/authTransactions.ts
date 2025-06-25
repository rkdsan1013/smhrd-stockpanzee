// /backend/src/models/authTransactions.ts
import pool from "../config/db";
import { INSERT_USER, INSERT_USER_PROFILE } from "./authQueries";

export async function registerUserTransaction(
  userUuid: Buffer,
  email: string,
  hashedPassword: string,
  username: string,
) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(INSERT_USER, [userUuid, email, hashedPassword]);
    await conn.query(INSERT_USER_PROFILE, [userUuid, username]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
