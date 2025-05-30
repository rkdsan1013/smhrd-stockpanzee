// src/services/authService.ts
import apiClient from "./apiClient";

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
    const response = await apiClient.post<AuthResponse>("/auth/register", data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

const loginUser = async (data: LoginData): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>("/auth/login", data);
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
};

export default {
  registerUser,
  loginUser,
};
