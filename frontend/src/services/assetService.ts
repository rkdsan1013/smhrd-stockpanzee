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
/*  초경량 전역 캐시 + localStorage 보조                               */
/* ------------------------------------------------------------------ */
let assetCache: Asset[] | null = null; // 메모리 캐시
let pending: Promise<Asset[]> | null = null; // 중복 요청 방지
const LS_KEY = "asset_cache_v1"; // storage 키

/** localStorage → 메모리 캐시 로드 (있으면 반환) */
function loadFromStorage(): Asset[] | null {
  if (assetCache) return assetCache;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      assetCache = JSON.parse(raw) as Asset[];
      return assetCache;
    }
  } catch {
    /* ignore corrupted storage */
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  자산 리스트 조회 (+캐시)                                           */
/* ------------------------------------------------------------------ */
/**
 * GET /api/assets
 * - 첫 호출만 네트워크 요청
 * - 이후엔 메모리 캐시 반환
 * - 새로고침 후에도 localStorage 값으로 즉시 렌더
 */
export const fetchAssets = (config?: AxiosRequestConfig): Promise<Asset[]> => {
  // 1) 이미 메모리에 있으면 바로 반환
  if (assetCache) return Promise.resolve(assetCache);

  // 2) 동일 요청 진행 중이면 그 프라미스 재사용
  if (pending) return pending;

  // 3) localStorage 값이 있으면 즉시 반환하면서 백그라운드 새로고침
  const stored = loadFromStorage();
  if (stored) {
    pending = get<Asset[]>("/assets", config)
      .then((data) => {
        assetCache = data;
        localStorage.setItem(LS_KEY, JSON.stringify(data));
        pending = null;
        return data;
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
    return Promise.resolve(stored);
  }

  // 4) 최후엔 네트워크 요청
  pending = get<Asset[]>("/assets", config).then((data) => {
    assetCache = data;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {
      /* ignore quota errors */
    }
    pending = null;
    return data;
  });
  return pending;
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
/** 캐시/스토리지 기반으로 즉시 반환 (네트워크 미사용) */
export const getAssetDictSync = (): Record<string, Asset> => {
  loadFromStorage(); // 필요 시 storage 로드
  return (
    assetCache?.reduce<Record<string, Asset>>((dict, a) => {
      dict[a.symbol] = a;
      return dict;
    }, {}) ?? {}
  );
};

/* ------------------------------------------------------------------ */
/*  default export (기존 구조 유지)                                    */
/* ------------------------------------------------------------------ */
export default {
  fetchAssets,
  fetchAssetById,
};
