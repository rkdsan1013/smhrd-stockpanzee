// /backend/src/services/userService.ts
import bcrypt from "bcrypt";
import * as authModel from "../models/authModel";

export interface UserProfile {
  uuid: string;
  email: string;
  username: string;
  avatar_url: string | null;
}

/**
 * 프로필 조회: UUID(hex) → Buffer → DB 조회 → UserProfile 반환
 */
export async function getProfileService(uuidHex: string): Promise<UserProfile> {
  const buf = Buffer.from(uuidHex, "hex");
  const rows = await authModel.findUserByUuid(buf);
  if (rows.length === 0) {
    throw { statusCode: 404, message: "User not found" };
  }
  const { uuid, username, avatar_url, email } = rows[0] as any;
  return {
    uuid: uuid.toString("hex"),
    username,
    avatar_url,
    email,
  };
}

/**
 * 프로필 수정: email, password, username 변경
 */
export async function updateProfileService(
  uuidHex: string,
  updates: { email?: string; password?: string; username?: string },
): Promise<UserProfile> {
  const buf = Buffer.from(uuidHex, "hex");

  // 이메일 변경 시 중복 체크
  if (updates.email) {
    const existing = await authModel.findUserByEmail(updates.email);
    if (existing.length > 0 && existing[0].uuid.toString("hex") !== uuidHex) {
      throw { statusCode: 400, message: "이미 등록된 이메일입니다." };
    }
    await authModel.updateUserEmail(buf, updates.email);
  }

  // 비밀번호 변경 (해시 처리)
  if (updates.password) {
    const hashed = await bcrypt.hash(updates.password, 10);
    await authModel.updateUserPassword(buf, hashed);
  }

  // 이름 변경
  if (updates.username) {
    await authModel.updateUserProfile(buf, updates.username);
  }

  // 변경된 프로필 재조회 후 반환
  return getProfileService(uuidHex);
}
