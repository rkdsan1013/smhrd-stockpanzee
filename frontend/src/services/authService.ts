// /frontend/src/services/authService.ts
import { get, post } from "./apiClient";

// 타입 전용(import type) 사용
export type RegisterData = {
  username: string;
  email: string;
  password: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export interface AuthResponse {
  success: boolean;
  message: string;
}

const registerUser = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    // 요청 URL은 /api/auth/register가 됩니다. (axiosInstance의 baseURL에 /api가 붙어 있음)
    const response = await post<AuthResponse>("/auth/register", data);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  try {
    // 로그인 엔드포인트: /api/auth/login
    const response = await post<AuthResponse>("/auth/login", data);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export default { registerUser, loginUser };
