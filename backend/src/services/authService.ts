// /backend/src/services/authService.ts
import bcrypt from "bcrypt";
import { v4 as uuidv4, parse as uuidParse } from "uuid";
import { signJwt } from "../utils/jwt";
import * as authModel from "../models/authModel";

export interface UserProfile {
  uuid: string;
  username: string;
  avatar_url: string | null;
}

export interface User {
  uuid: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  google_id?: string;
}

/**
 * 회원가입:
 * 1. 이메일 중복 체크
 * 2. 비밀번호 해싱
 * 3. users + user_profiles 트랜잭션
 * 4. JWT 발급 (payload: { uuid: hex } )
 */
export async function registerUserService(
  username: string,
  email: string,
  password: string,
): Promise<string> {
  const existing = await authModel.findUserByEmail(email);
  if (existing.length) {
    throw { statusCode: 400, message: "이미 등록된 이메일입니다." };
  }

  const hashed = await bcrypt.hash(password, 10);

  // 16바이트 버퍼 → 32자리 hex
  const rawUuid = uuidv4();
  const uuidBuf = Buffer.from(uuidParse(rawUuid));
  const uuidHex = uuidBuf.toString("hex");

  // DB 저장
  await authModel.registerUser(uuidBuf, email, hashed, username);

  // JWT 발급 (1시간 만료)
  const token = await signJwt({ uuid: uuidHex }, { expiresIn: "1h" });
  return token;
}

/**
 * 로그인:
 * 1. 이메일 조회
 * 2. 비밀번호 비교
 * 3. JWT 발급
 */
export async function loginUserService(email: string, password: string): Promise<string> {
  const users = await authModel.findUserByEmail(email);
  if (!users.length) {
    throw { statusCode: 400, message: "가입된 사용자가 없습니다." };
  }

  const user = users[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw { statusCode: 400, message: "비밀번호가 일치하지 않습니다." };
  }

  const uuidHex = user.uuid.toString("hex");
  const token = await signJwt({ uuid: uuidHex }, { expiresIn: "1h" });
  return token;
}

/**
 * 프로필 조회:
 * payload.uuid(hex) → Buffer → DB 프로필 조회
 */
export async function getProfileService(uuidHex: string): Promise<UserProfile> {
  const buf = Buffer.from(uuidHex, "hex");
  const profiles = await authModel.findUserByUuid(buf);
  if (!profiles.length) {
    throw { statusCode: 404, message: "사용자를 찾을 수 없습니다." };
  }

  const row = profiles[0];
  return { uuid: uuidHex, username: row.username, avatar_url: row.avatar_url };
}

/**
 * 구글 OAuth: 기존 사용자 조회 또는 신규 등록
 */
export async function findOrCreateGoogleUser(data: {
  email: string;
  username: string;
  avatar_url?: string;
  google_id: string;
}): Promise<User> {
  const existing = await authModel.findUserByEmail(data.email);

  if (existing.length) {
    const bufUuid = existing[0].uuid;
    const uuidHex = bufUuid.toString("hex");
    const profiles = await authModel.findUserByUuid(bufUuid);
    return {
      uuid: uuidHex,
      username: profiles[0]?.username ?? data.username,
      email: data.email,
      avatar_url: profiles[0]?.avatar_url ?? data.avatar_url,
      google_id: data.google_id,
    };
  }

  const rawUuid = uuidv4();
  const uuidBuf = Buffer.from(uuidParse(rawUuid));
  const uuidHex = uuidBuf.toString("hex");
  const googlePass = await bcrypt.hash(`google-oauth2:${data.google_id}`, 10);

  await authModel.registerUser(uuidBuf, data.email, googlePass, data.username, data.avatar_url);

  return {
    uuid: uuidHex,
    username: data.username,
    email: data.email,
    avatar_url: data.avatar_url ?? null,
    google_id: data.google_id,
  };
}

/**
 * 토큰 재발급 등 범용 JWT 생성 헬퍼
 */
export async function generateJwtForUser(uuidHex: string): Promise<string> {
  return signJwt({ uuid: uuidHex }, { expiresIn: "1h" });
}
