// /frontend/src/services/userService.ts
import { get, put } from "./apiClient";

export interface UserProfile {
  uuid: string;
  email: string;
  username: string;
  avatar_url: string | null;
}

export type UpdateProfileData = {
  email?: string;
  password?: string;
  username?: string;
  currentPassword?: string;
};

/**
 * 내 프로필 조회
 */
export async function fetchUserProfile(): Promise<UserProfile> {
  // get<T>는 응답 데이터의 data 프로퍼티를 바로 반환합니다.
  const res = await get<{ success: boolean; data: UserProfile }>("/user/me");
  return res.data;
}

/**
 * 내 프로필 수정
 */
export async function updateUserProfile(data: UpdateProfileData): Promise<UserProfile> {
  const res = await put<{ success: boolean; data: UserProfile }>("/user/me", data);
  return res.data;
}

export default { fetchUserProfile, updateUserProfile };
