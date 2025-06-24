// /backend/src/services/authService.ts
import bcrypt from "bcrypt";
import { v4 as uuidv4, parse as uuidParse } from "uuid";
import { SignJWT } from "jose";
import { jwtSecret } from "../config/jose";
import * as authModel from "../models/authModel";

export interface UserProfile {
  uuid: string;
  username: string;
  avatar_url: string | null;
}

/**
 * 회원가입: 이메일 중복 → 해시 → users+profiles 트랜잭션 → JWT 반환
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

  // 비밀번호 해싱
  const hashed = await bcrypt.hash(password, 10);

  // UUID 생성 & Buffer 변환
  const rawUuid = uuidv4();
  const uuidBuf = Buffer.from(uuidParse(rawUuid));
  // 토큰 페이로드용 16바이트를 32자리 hex 문자열로
  const uuidHex = uuidBuf.toString("hex");

  // DB 등록
  await authModel.registerUser(uuidBuf, email, hashed, username);

  // JWT 생성 (payload.uuid는 hyphen 없는 hex)
  const token = await new SignJWT({ uuid: uuidHex })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(jwtSecret);

  return token;
}

/**
 * 로그인: 이메일 조회 → 비밀번호 비교 → JWT 반환
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

  // DB uuid(Buffer) → hex
  const uuidHex = user.uuid.toString("hex");

  const token = await new SignJWT({ uuid: uuidHex })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(jwtSecret);

  return token;
}

/**
 * 프로필 조회: payload.uuid(hex) → Buffer → DB 조회
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
