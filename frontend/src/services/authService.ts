// /frontend/src/services/authService.ts
import apiClient, { get, post, put, patch, remove } from "./apiClient";

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
    const response = await post<AuthResponse>("/auth/register", data);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await post<AuthResponse>("/auth/login", data);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export default { registerUser, loginUser };
