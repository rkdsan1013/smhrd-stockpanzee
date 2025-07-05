// /frontend/src/services/assetService.ts
import type { AxiosRequestConfig } from "axios";
import { get } from "./apiClient";

/* ------------------------------------------------------------------ */
/*  자산 타입 정의                                                     */
/* ------------------------------------------------------------------ */
export interface Asset {
  id: number;
  symbol: string;
  name: string;
  market: string;
  created_at: string;
  updated_at: string;
  currentPrice: number;
  priceChange: number;
  marketCap: number;
}

/* ------------------------------------------------------------------ */
/*  자산 리스트 조회                                                  */
/* ------------------------------------------------------------------ */
/**
 * GET /api/assets
 * - 항상 네트워크 요청
 */
export const fetchAssets = (config?: AxiosRequestConfig): Promise<Asset[]> => {
  return get<Asset[]>("/assets", config);
};

/* ------------------------------------------------------------------ */
/*  단일 자산 조회                                                     */
/* ------------------------------------------------------------------ */
/** GET /api/assets/:id */
export const fetchAssetById = (id: number, config?: AxiosRequestConfig): Promise<Asset> => {
  return get<Asset>(`/assets/${id}`, config);
};

/* ------------------------------------------------------------------ */
/*  동기 헬퍼: symbol → Asset 매핑                                     */
/* ------------------------------------------------------------------ */
/**
 * 캐시 로직 없이 빈 객체 반환
 * 필요한 경우 fetchAssets 후 매핑을 직접 생성하세요.
 */
export const getAssetDictSync = (): Record<string, Asset> => {
  return {};
};

/* ------------------------------------------------------------------ */
/*  default export (기존 구조 유지)                                    */
/* ------------------------------------------------------------------ */
export default {
  fetchAssets,
  fetchAssetById,
};
