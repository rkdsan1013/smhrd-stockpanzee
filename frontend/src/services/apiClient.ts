// src/services/apiClient.ts
import axios from "axios";
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000",
  headers: {
    "Content-Type": "application/json",
  },
  // HttpOnly 쿠키 등 포함해서 요청하려면 withCredentials를 true로 설정합니다.
  withCredentials: true,
});

// 요청 인터셉터: 내부 AxiosRequestConfig 타입을 사용합니다.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => config,
  (error: AxiosError): Promise<AxiosError> => Promise.reject(error),
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError): Promise<AxiosError> => Promise.reject(error),
);

export default apiClient;
