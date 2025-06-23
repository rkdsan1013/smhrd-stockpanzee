// /frontend/src/services/assetService.ts
import type { AxiosRequestConfig } from "axios";
import { get } from "./apiClient";

export interface Asset {
  id: number;
  symbol: string;
  name: string;
  market: string;
  created_at: string;
  updated_at: string;

  // ✅ 추가된 필드 (백엔드에서 전달되는 실시간 데이터)
  currentPrice: number;
  priceChange: number;
  marketCap: number;
}

/**
 * 자산 리스트(주식/암호화폐) 조회
 * GET /api/assets
 */
export const fetchAssets = (config?: AxiosRequestConfig): Promise<Asset[]> => {
  return get<Asset[]>("/assets", config);
};

/**
 * 단일 자산 조회 (필요 시)
 * GET /api/assets/:id
 */
export const fetchAssetById = (id: number, config?: AxiosRequestConfig): Promise<Asset> => {
  return get<Asset>(`/assets/${id}`, config);
};

export default {
  fetchAssets,
  fetchAssetById,
};
