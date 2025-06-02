// /frontend/src/services/apiClient.ts
import axios from "axios";
import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// 커스텀 ApiError 클래스
export class ApiError extends Error {
  public statusCode?: number;
  public data?: any;
  constructor(message: string, statusCode?: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

// axios 인스턴스 생성 및 기본 설정
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

// 요청 인터셉터: 토큰이 있는 경우 기본 Authorization 헤더로 추가
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    config.headers = config.headers || {};
    const token = window.localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// 응답 인터셉터: 에러 메시지 통일 및 ApiError 반환
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    let errorMessage = "알 수 없는 오류가 발생했습니다.";
    let statusCode: number | undefined = undefined;
    let errorData: any = undefined;

    if (error.response && error.response.data) {
      const data = error.response.data as { message?: string };
      errorMessage = data.message || errorMessage;
      statusCode = error.response.status;
      errorData = data;
    } else if (error.message) {
      errorMessage = error.message;
    }
    if (import.meta.env.DEV) console.error("API Error:", error);
    return Promise.reject(new ApiError(errorMessage, statusCode, errorData));
  },
);

// 공통 요청 함수 (DRY 원칙 적용)
const request = async <T>(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  payload?: any,
  config?: AxiosRequestConfig,
): Promise<T> => {
  let response: AxiosResponse<T>;
  if (method === "get" || method === "delete") {
    response = await axiosInstance[method]<T>(url, config);
  } else {
    response = await axiosInstance[method]<T>(url, payload, config);
  }
  return response.data;
};

// API 유틸리티 함수들
export const get = <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  request<T>("get", url, undefined, config);

export const post = <T>(url: string, payload?: any, config?: AxiosRequestConfig): Promise<T> =>
  request<T>("post", url, payload, config);

export const put = <T>(url: string, payload?: any, config?: AxiosRequestConfig): Promise<T> =>
  request<T>("put", url, payload, config);

export const patch = <T>(url: string, payload?: any, config?: AxiosRequestConfig): Promise<T> =>
  request<T>("patch", url, payload, config);

export const remove = <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  request<T>("delete", url, undefined, config);

export default axiosInstance;
