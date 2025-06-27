// /backend/src/services/binanceService.ts
import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { upsertCryptoInfo, findCryptoAssets } from "../../models/assetModel";
import pool from "../../config/db";
import { getExchangeRate } from "../../utils/exchangeRate";

const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/24hr";
const COINLORE_URL = "https://api.coinlore.net/api/tickers/";

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
}

// ── 시가총액 캐시 ─────────────────────────────────────────────────────
let marketCapCache: Record<string, number> = {};
let lastFetchTime = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getMarketCapMap(): Promise<Record<string, number>> {
  if (Date.now() - lastFetchTime > CACHE_TTL) {
    try {
      const assets = await findCryptoAssets();
      const needSyms = new Set(assets.map((a) => a.symbol.toUpperCase()));
      const map: Record<string, number> = {};
      for (let start = 0; start < 500; start += 100) {
        const res = await axios.get<{ data: any[] }>(`${COINLORE_URL}?start=${start}&limit=100`);
        for (const item of res.data.data) {
          const sym = String(item.symbol).toUpperCase();
          if (needSyms.has(sym)) {
            map[sym] = parseFloat(item.market_cap_usd) || 0;
          }
        }
        if (Object.keys(map).length >= needSyms.size) break;
        await sleep(500);
      }
      marketCapCache = map;
      lastFetchTime = Date.now();
      console.log(`[시총 로그] 캐시 리프레시 완료: ${Object.keys(map).length}개 심볼`);
    } catch (err: any) {
      console.warn("[시총 로그] 캐시 리프레시 실패:", err.message || err);
    }
  }
  return marketCapCache;
}
// ──────────────────────────────────────────────────────────────────────

/**
 * 최초 1회 실행: 비어있는 시총만 KRW로 채우기
 */
export async function updateCryptoMarketCapOnce() {
  try {
    const EXCHANGE_RATE = await getExchangeRate("USD", "KRW");
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
 * 주기적 업데이트: 가격·변동률 매번, 시총 캐시 사용 (1일 1회)
 */
export async function updateCryptoAssetInfoPeriodically() {
  try {
    const EXCHANGE_RATE = await getExchangeRate("USD", "KRW");
    const cache = await getMarketCapMap();
    const assets = await findCryptoAssets();
    const { data: tickers } = await axios.get<BinanceTicker[]>(BINANCE_TICKER_URL);

    for (const t of tickers) {
      if (!t.symbol.endsWith("USDT")) continue;
      const symbol = t.symbol.slice(0, -4).toUpperCase();
      const asset = assets.find((a) => a.symbol === symbol);
      if (!asset) continue;

      const priceUsd = parseFloat(t.lastPrice);
      const priceKrw = priceUsd * EXCHANGE_RATE;
      const changePct = parseFloat(t.priceChangePercent);

      const usdCap = cache[symbol] || 0;
      const marketCapKrw = usdCap * EXCHANGE_RATE;

      await upsertCryptoInfo(asset.id, priceKrw, changePct, marketCapKrw);
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
