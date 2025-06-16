// /backend/src/services/authService.ts
import bcrypt from "bcrypt";
import { v4 as uuidv4, parse as uuidParse } from "uuid";
import { SignJWT } from "jose";
import { TextEncoder } from "util";
import * as authModel from "../models/authModel";

// JWT 서명을 위한 비밀 키 (환경변수에서 읽음)
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");

/**
 * 회원가입 서비스를 수행합니다.
 * - 중복 등록 검사
 * - 비밀번호 해싱
 * - UUID 생성 후 DB 등록 (users, user_profiles)
 * - JWT 토큰 생성 후 반환
 */
export async function registerUserService(
  username: string,
  email: string,
  password: string,
): Promise<string> {
  // 중복 등록 검사
  const existingUsers = await authModel.findUserByEmail(email);
  if (existingUsers.length > 0) {
    throw new Error("이미 등록된 이메일입니다.");
  }

  // 비밀번호 해싱
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // UUID 생성 및 BINARY(16) 변환
  const userUuid = uuidv4();
  const userUuidBuffer = Buffer.from(uuidParse(userUuid));

  // DB에 사용자 등록 (users, user_profiles)
  await authModel.registerUser(userUuidBuffer, email, hashedPassword, username);

  // JWT 토큰 생성 (payload에 uuid 포함)
  const token = await new SignJWT({ uuid: userUuid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(jwtSecret);

  return token;
}

/**
 * 로그인 서비스를 수행합니다.
 * - 이메일로 사용자 조회 후, 비밀번호 검증
 * - JWT 토큰 생성 후 반환
 */
export async function loginUserService(email: string, password: string): Promise<string> {
  // 이메일로 사용자 조회
  const users = await authModel.findUserByEmail(email);
  if (users.length === 0) {
    throw new Error("가입된 사용자가 없습니다.");
  }
  const user = users[0];

  // 비밀번호 비교
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("비밀번호가 일치하지 않습니다.");
  }

  // DB의 BINARY uuid를 hex 문자열로 변환
  const userUuidStr = user.uuid.toString("hex");

  // JWT 토큰 생성 (payload에 uuid 포함)
  const token = await new SignJWT({ uuid: userUuidStr })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(jwtSecret);

  return token;
}
