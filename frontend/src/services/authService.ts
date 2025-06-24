// /frontend/src/services/authService.ts
import { post, get } from "./apiClient";

export type RegisterData = {
  username: string;
  email: string;
  password: string;
};
export type LoginData = {
  email: string;
  password: string;
};

export interface UserProfile {
  uuid: string;
  username: string;
  avatar_url: string | null;
}

// 회원가입
export const registerUser = async (data: RegisterData): Promise<void> => {
  await post("/auth/register", data);
};

// 로그인 (쿠키만 받고, 토큰은 백엔드가 HttpOnly 쿠키에 저장)
export const loginUser = async (data: LoginData): Promise<void> => {
  await post("/auth/login", data);
};

// 내 프로필 조회
export const fetchProfile = async (): Promise<UserProfile> => {
  const res = await get<{ success: boolean; data: UserProfile }>("/user/me");
  return res.data;
};

export default { registerUser, loginUser, fetchProfile };
