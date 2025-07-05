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
/*  전역 캐시(on‐page) + localStorage 보조                             */
/*  하지만 fetchAssets()는 매 호출시 네트워크에서 최신 데이터를 가져오도록 변경 */
/* ------------------------------------------------------------------ */
let assetCache: Asset[] | null = null; // 메모리 캐시
let pending: Promise<Asset[]> | null = null; // 중복 요청 방지
const LS_KEY = "asset_cache_v1"; // storage 키

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
    // corrupted storage 무시
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  자산 리스트 조회 (+캐시)                                           */
/* ------------------------------------------------------------------ */
/**
 * GET /api/assets
 * - 매 호출마다 네트워크 요청을 보내 최신 데이터를 가져옴
 * - 요청 중복 방지를 위해 pending 사용
 * - 결과는 메모리 + localStorage에 저장
 */
export const fetchAssets = (config?: AxiosRequestConfig): Promise<Asset[]> => {
  // 1) 요청이 이미 진행 중이면 그 프라미스 반환
  if (pending) {
    return pending;
  }

  // 2) 로컬스토리지에 남아 있는 캐시를 메모리에 로드 (optional, 페이지 초기 렌더용)
  loadFromStorage();

  // 3) 항상 네트워크 요청으로 최신 데이터 가져오기
  pending = get<Asset[]>("/assets", config)
    .then((data) => {
      assetCache = data;
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(data));
      } catch {
        // quota errors 무시
      }
      pending = null;
      return data;
    })
    .catch((err) => {
      pending = null;
      throw err;
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
/**
 * 메모리 캐시가 비어 있으면 storage에서 로드
 * 네트워크 호출 없이 즉시 심볼→자산 매핑 객체 반환
 */
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
/*  default export                                                    */
/* ------------------------------------------------------------------ */
export default {
  fetchAssets,
  fetchAssetById,
};
