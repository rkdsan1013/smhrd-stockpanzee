// /backend/src/models/authModel.ts
import pool from "../config/db";
import {
  SELECT_USER_BY_EMAIL,
  SELECT_USER_BY_UUID,
  UPDATE_USER_EMAIL,
  UPDATE_USER_PASSWORD,
  UPDATE_USER_PROFILE,
} from "./authQueries";
import {
  DELETE_LIKES_BY_USER,
  DELETE_FAVORITES_BY_USER,
  DELETE_COMMENTS_BY_USER,
  DELETE_POSTS_BY_USER,
  DELETE_PROFILE_BY_USER,
  DELETE_USER,
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

/** 이메일로 사용자 조회 */
export async function findUserByEmail(email: string): Promise<DbUser[]> {
  const [rows] = await pool.query(SELECT_USER_BY_EMAIL, [email]);
  return rows as DbUser[];
}

/**
 * 회원가입
 * 1) users          테이블에 기본 정보 저장
 * 2) user_profiles  테이블에 프로필 정보 저장
 * 두 쿼리를 하나의 트랜잭션으로 처리
 */
export async function registerUser(
  userUuid: Buffer,
  email: string,
  hashedPassword: string,
  username: string,
  avatar_url?: string | null,
) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query("INSERT INTO users (uuid, email, password) VALUES (?, ?, ?)", [
      userUuid,
      email,
      hashedPassword,
    ]);

    await conn.query("INSERT INTO user_profiles (uuid, name, avatar_url) VALUES (?, ?, ?)", [
      userUuid,
      username,
      avatar_url ?? null,
    ]);

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** UUID로 프로필 조회 */
export async function findUserByUuid(uuid: Buffer): Promise<UserProfile[]> {
  const [rows] = await pool.query(SELECT_USER_BY_UUID, [uuid]);
  return rows as UserProfile[];
}

/** users.email 갱신 */
export async function updateUserEmail(uuid: Buffer, email: string) {
  await pool.query(UPDATE_USER_EMAIL, [email, uuid]);
}

/** users.password 갱신 */
export async function updateUserPassword(uuid: Buffer, hashedPassword: string) {
  await pool.query(UPDATE_USER_PASSWORD, [hashedPassword, uuid]);
}

/** user_profiles.name 갱신 */
export async function updateUserProfile(uuid: Buffer, username: string) {
  await pool.query(UPDATE_USER_PROFILE, [username, uuid]);
}


export async function deleteUserCascade(uuid: Buffer) {
  const conn = await pool.getConnection();
  try {
    await conn.query(DELETE_LIKES_BY_USER, [uuid]);
    await conn.query(DELETE_FAVORITES_BY_USER, [uuid]);
    await conn.query(DELETE_COMMENTS_BY_USER, [uuid]);
    await conn.query(DELETE_POSTS_BY_USER, [uuid]);
    await conn.query(DELETE_PROFILE_BY_USER, [uuid]);
    await conn.query(DELETE_USER, [uuid]);
    console.log("회원 탈퇴 완료");
  } catch (err) {
    await conn.rollback();
    console.log("회원 탈퇴 트랜잭션 롤백:", err);
    throw err;
  } finally {
    conn.release();
  }
}

// user의 인증 정보(비번)만 조회
export async function findUserAuthByUuid(uuid: Buffer): Promise<{ uuid: Buffer; password: string }[]> {
  const [rows] = await pool.query("SELECT uuid, password FROM users WHERE uuid = ?", [uuid]);
  return rows as { uuid: Buffer; password: string }[];
}

