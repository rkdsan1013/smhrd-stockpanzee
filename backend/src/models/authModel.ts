// /backend/src/models/authModel.ts
import pool from "../config/db";
import {
  SELECT_USER_BY_EMAIL,
  SELECT_USER_BY_UUID,
  UPDATE_USER_EMAIL,
  UPDATE_USER_PASSWORD,
  UPDATE_USER_PROFILE,
} from "./authQueries";
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

/**
 * (기존) 회원가입 처리
 */
export async function registerUser(
  userUuid: Buffer,
  email: string,
  hashedPassword: string,
  username: string,
) {
  await registerUserTransaction(userUuid, email, hashedPassword, username);
}

/**
 * (기존) UUID로 프로필 조회
 */
export async function findUserByUuid(uuid: Buffer): Promise<UserProfile[]> {
  const [rows] = await pool.query(SELECT_USER_BY_UUID, [uuid]);
  return rows as UserProfile[];
}

/**
 * 이메일 중복 체크용
 */
export async function findUserByEmail(email: string): Promise<DbUser[]> {
  const [rows] = await pool.query(SELECT_USER_BY_EMAIL, [email]);
  return rows as DbUser[];
}

/**
 * 프로필 수정: users.email 변경
 */
export async function updateUserEmail(uuid: Buffer, email: string) {
  await pool.query(UPDATE_USER_EMAIL, [email, uuid]);
}

/**
 * 프로필 수정: users.password 변경
 */
export async function updateUserPassword(uuid: Buffer, hashedPassword: string) {
  await pool.query(UPDATE_USER_PASSWORD, [hashedPassword, uuid]);
}

/**
 * 프로필 수정: user_profiles.name 변경
 */
export async function updateUserProfile(uuid: Buffer, username: string) {
  await pool.query(UPDATE_USER_PROFILE, [username, uuid]);
}
