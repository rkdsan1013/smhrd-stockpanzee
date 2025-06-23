// /backend/src/services/binanceService.ts

import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

import { upsertCryptoInfo, findCryptoAssets } from "../models/assetModel";
import pool from "../config/db";

// 환율 상수: 1 USD = 1400 KRW
const EXCHANGE_RATE = 1400;
console.log(`[환율 로그] 1 USD = ${EXCHANGE_RATE} KRW`);

const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/24hr";
// Coinlore는 API 키 불필요, 최대 100개씩 페이지네이션 지원
const COINLORE_URL = "https://api.coinlore.net/api/tickers/";

// ── 캐시 로직 ────────────────────────────────────────────────────────────────
let marketCapCache: Record<string, number> = {};
let lastFetchTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function getMarketCapMap(): Promise<Record<string, number>> {
  // TTL 검사
  if (Date.now() - lastFetchTime > CACHE_TTL) {
    try {
      // DB에서 갱신 대상 심볼 집합 가져오기
      const assets = await findCryptoAssets();
      const needSyms = new Set(assets.map((a) => a.symbol.toUpperCase()));
      const map: Record<string, number> = {};

      // Coinlore는 100개씩 페이지네이션, 최대 5페이지까지 시도
      const pageSize = 100;
      for (let start = 0; start < 500; start += pageSize) {
        const res = await axios.get<{ data: any[] }>(
          `${COINLORE_URL}?start=${start}&limit=${pageSize}`,
        );
        res.data.data.forEach((item) => {
          const sym = String(item.symbol).toUpperCase();
          if (needSyms.has(sym)) {
            map[sym] = parseFloat(item.market_cap_usd) || 0;
          }
        });
        // 모두 찾았으면 중단
        if (Object.keys(map).length >= needSyms.size) break;
        // 다음 페이지 호출 전 짧은 텀
        await sleep(500);
      }

      marketCapCache = map;
      lastFetchTime = Date.now();
      console.log(`[시총 로그] 캐시 리프레시 완료: ${Object.keys(map).length}개 심볼 로드`);
    } catch (err: any) {
      console.warn("[시총 로그] 캐시 리프레시 실패:", err.message || err);
      // 실패 시에도 기존 캐시 유지
    }
  }
  return marketCapCache;
}
// ─────────────────────────────────────────────────────────────────────────────

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
}

/**
 * 최초 한 번: 캐시된 시총으로 market_cap이 비어있는 자산만 채우기
 */
export async function updateCryptoMarketCapOnce(): Promise<void> {
  try {
    const cache = await getMarketCapMap();
    const assets = await findCryptoAssets();

    for (const asset of assets) {
      const usdCap = cache[asset.symbol.toUpperCase()] || 0;
      const krwCap = usdCap * EXCHANGE_RATE;
      const conn = await pool.getConnection();
      try {
        await conn.execute(
          `UPDATE asset_info
             SET market_cap = ?, last_updated = NOW()
           WHERE asset_id = ? AND (market_cap IS NULL OR market_cap = 0)`,
          [krwCap, asset.id],
        );
      } finally {
        conn.release();
      }
    }
    console.log("[시총 로그] updateCryptoMarketCapOnce 완료");
  } catch (err: any) {
    console.error("[BinanceService] updateCryptoMarketCapOnce 오류:", err.message || err);
  }
}

/**
 * 주기적 업데이트: Binance 가격·변동률은 매번, 시가총액은 캐시 사용 (1일 1회)
 */
export async function updateCryptoAssetInfoPeriodically(): Promise<void> {
  try {
    const cache = await getMarketCapMap();
    const assets = await findCryptoAssets();

    const { data: tickers } = await axios.get<BinanceTicker[]>(BINANCE_TICKER_URL);
    for (const t of tickers) {
      if (!t.symbol.endsWith("USDT")) continue;

      const symbol = t.symbol.slice(0, -4).toUpperCase();
      const asset = assets.find((a) => a.symbol === symbol);
      if (!asset) continue;

      const price = parseFloat(t.lastPrice);
      const change = parseFloat(t.priceChangePercent);
      const usdCap = cache[symbol] || 0;
      const krwCap = usdCap * EXCHANGE_RATE;

      await upsertCryptoInfo(asset.id, price, change, krwCap);
    }

    console.log("[BinanceService] updateCryptoAssetInfoPeriodically 완료");
  } catch (err: any) {
    console.error(
      "[BinanceService] updateCryptoAssetInfoPeriodically 오류:",
      err.response?.status || "",
      err.message || err,
    );
  }
}
