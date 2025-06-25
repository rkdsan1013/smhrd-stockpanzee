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

export async function registerUser(
  userUuid: Buffer,
  email: string,
  hashedPassword: string,
  username: string,
) {
  await registerUserTransaction(userUuid, email, hashedPassword, username);
}

export async function findUserByUuid(uuid: Buffer): Promise<UserProfile[]> {
  const [rows] = await pool.query(SELECT_USER_BY_UUID, [uuid]);
  return rows as UserProfile[];
}
