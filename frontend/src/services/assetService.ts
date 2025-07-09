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
  marketCap: number;
}

/* ------------------------------------------------------------------ */
/*  가격 업데이트 전용 타입                                            */
/* ------------------------------------------------------------------ */
export interface AssetPrice {
  id: number;
  currentPrice: number;
  priceChange: number;
}

/* ------------------------------------------------------------------ */
/*  전역 캐시(on‐page) + localStorage 보조                             */
/* ------------------------------------------------------------------ */
let assetCache: Asset[] | null = null;
let pendingAssets: Promise<Asset[]> | null = null;
const LS_KEY = "asset_cache_v1";

/** localStorage → 메모리 캐시 로드 */
function loadFromStorage(): Asset[] | null {
  if (assetCache) return assetCache;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      assetCache = JSON.parse(raw) as Asset[];
      return assetCache;
    }
  } catch {
    // ignore
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  전체 자산 메타데이터 조회 (+캐시)                                  */
/* ------------------------------------------------------------------ */
/**
 * GET /api/assets
 * - 매 호출시 네트워크에서 최신 메타데이터(fetch once 용)
 * - pendingAssets로 중복 요청 방지
 * - 결과는 메모리 + localStorage에 저장
 */
export const fetchAssets = (config?: AxiosRequestConfig): Promise<Asset[]> => {
  if (pendingAssets) return pendingAssets;

  loadFromStorage();

  pendingAssets = get<Asset[]>("/assets", config)
    .then((data) => {
      // 단순 메타데이터만 assetCache에 저장
      assetCache = data.map(({ id, symbol, name, market, created_at, updated_at, marketCap }) => ({
        id,
        symbol,
        name,
        market,
        created_at,
        updated_at,
        marketCap,
      }));
      localStorage.setItem(LS_KEY, JSON.stringify(assetCache));
      pendingAssets = null;
      return assetCache!;
    })
    .catch((err) => {
      pendingAssets = null;
      throw err;
    });

  return pendingAssets;
};

/* ------------------------------------------------------------------ */
/*  가격 정보만 주기 업데이트                                          */
/* ------------------------------------------------------------------ */
/**
 * GET /api/assets/prices
 * - { id, currentPrice, priceChange } 목록
 */
export const fetchAssetPrices = (config?: AxiosRequestConfig): Promise<AssetPrice[]> => {
  return get<AssetPrice[]>("/assets/prices", config);
};

/* ------------------------------------------------------------------ */
/*  동기 헬퍼: symbol → Asset 매핑 (메모리 캐시 기반)                   */
/* ------------------------------------------------------------------ */
export const getAssetDictSync = (): Record<string, Asset> => {
  loadFromStorage();
  return (
    assetCache?.reduce<Record<string, Asset>>((dict, a) => {
      dict[a.symbol] = a;
      return dict;
    }, {}) ?? {}
  );
};

/* ------------------------------------------------------------------ */
/*  단일 자산 조회                                                     */
/* ------------------------------------------------------------------ */
export const fetchAssetById = (id: number, config?: AxiosRequestConfig) => {
  return get<Asset>(`/assets/${id}`, config);
};

/* ------------------------------------------------------------------ */
/*  default export                                                    */
/* ------------------------------------------------------------------ */
export default {
  fetchAssets,
  fetchAssetById,
  fetchAssetPrices,
};
