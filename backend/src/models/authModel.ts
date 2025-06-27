// /backend/src/models/authModel.ts
import pool from "../config/db";
import { SELECT_USER_BY_EMAIL, SELECT_USER_BY_UUID } from "./authQueries";
import { registerUserTransaction } from "./authTransactions";

export interface DbUser {
  uuid: Buffer;
  email: string;
  password: string;
}

export interface UserProfile {
  uuid: Buffer;
  username: string;
  avatar_url: string | null;
}

export async function findUserByEmail(email: string): Promise<DbUser[]> {
  const [rows] = await pool.query(SELECT_USER_BY_EMAIL, [email]);
  return rows as DbUser[];
}

// 예시: user_profiles 쿼리 함수에 avatar_url도 인자로 받게
export async function registerUser(
  userUuid: Buffer,
  email: string,
  hashedPassword: string,
  username: string,
  avatar_url?: string | null
) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      "INSERT INTO users (uuid, email, password) VALUES (?, ?, ?)",
      [userUuid, email, hashedPassword]
    );
    await conn.query(
      "INSERT INTO user_profiles (uuid, name, avatar_url) VALUES (?, ?, ?)",
      [userUuid, username, avatar_url ?? null]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}


export async function findUserByUuid(uuid: Buffer): Promise<UserProfile[]> {
  const [rows] = await pool.query(SELECT_USER_BY_UUID, [uuid]);
  return rows as UserProfile[];
}
