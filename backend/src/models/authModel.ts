// /backend/src/models/authModel.ts
import type { RowDataPacket } from "mysql2/promise";
import pool from "../config/db";
import {
  SELECT_USER_BY_EMAIL,
  SELECT_USER_BY_UUID,
  UPDATE_USER_EMAIL,
  UPDATE_USER_PASSWORD,
  UPDATE_USER_PROFILE,
  DELETE_LIKES_BY_USER,
  DELETE_FAVORITES_BY_USER,
  DELETE_COMMENTS_BY_USER,
  DELETE_POSTS_BY_USER,
  DELETE_PROFILE_BY_USER,
  DELETE_USER,
} from "./authQueries";
import { registerUserTransaction } from "./authTransactions";

export interface DbUser extends RowDataPacket {
  uuid: Buffer;
  email: string;
  password: string;
}

export interface UserProfile extends RowDataPacket {
  uuid: Buffer;
  username: string;
  avatar_url: string | null;
}

/** 이메일로 사용자 조회 */
export async function findUserByEmail(email: string): Promise<DbUser[]> {
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_USER_BY_EMAIL, [email]);
  return rows as DbUser[];
}

/** 회원가입 */
export async function registerUser(
  userUuid: Buffer,
  email: string,
  hashedPassword: string,
  username: string,
  avatar_url?: string | null,
): Promise<void> {
  await registerUserTransaction(userUuid, email, hashedPassword, username, avatar_url);
}

/** UUID로 프로필 조회 */
export async function findUserByUuid(uuid: Buffer): Promise<UserProfile[]> {
  const [rows] = await pool.query<RowDataPacket[]>(SELECT_USER_BY_UUID, [uuid]);
  return rows as UserProfile[];
}

/** 이메일 갱신 */
export async function updateUserEmail(uuid: Buffer, email: string): Promise<void> {
  await pool.query(UPDATE_USER_EMAIL, [email, uuid]);
}

/** 비밀번호 갱신 */
export async function updateUserPassword(uuid: Buffer, hashedPassword: string): Promise<void> {
  await pool.query(UPDATE_USER_PASSWORD, [hashedPassword, uuid]);
}

/** 사용자명 갱신 */
export async function updateUserProfile(uuid: Buffer, username: string): Promise<void> {
  await pool.query(UPDATE_USER_PROFILE, [username, uuid]);
}

/** 회원탈퇴 (cascade delete) */
export async function deleteUserCascade(uuid: Buffer): Promise<void> {
  const conn = await pool.getConnection();
  try {
    console.log("트랜잭션 시작 - 회원탈퇴 uuid:", uuid.toString("hex"));
    await conn.beginTransaction();

    console.log("users 삭제");
    await conn.query(DELETE_USER, [uuid]);

    await conn.commit();
    console.log("트랜잭션 커밋 완료");
  } catch (err) {
    console.error("트랜잭션 에러 발생, 롤백합니다.", err);
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** 인증 정보 조회 */
export async function findUserAuthByUuid(
  uuid: Buffer,
): Promise<{ uuid: Buffer; password: string }[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT uuid, password FROM users WHERE uuid = ?",
    [uuid],
  );
  return rows as { uuid: Buffer; password: string }[];
}
