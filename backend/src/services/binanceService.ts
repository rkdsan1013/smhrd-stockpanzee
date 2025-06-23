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
// coinpaprika는 API 키 필요 없음
const COINPAPRIKA_TICKERS_URL = "https://api.coinpaprika.com/v1/tickers?quotes=USD";

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
}

// CoinPaprika 응답 타입 (시가총액만 사용)
interface PaprikaTicker {
  symbol: string;
  quotes: {
    USD: {
      market_cap: number;
    };
  };
}

/**
 * 최초 한 번: CoinPaprika 전체 티커에서 시가총액만 뽑아 DB에 채워넣기
 */
export async function updateCryptoMarketCapOnce(): Promise<void> {
  try {
    // 1) CoinPaprika 전체 티커 조회
    const marketCapMap: Record<string, number> = {};
    const res = await axios.get<PaprikaTicker[]>(COINPAPRIKA_TICKERS_URL);
    res.data.forEach((t: PaprikaTicker) => {
      marketCapMap[t.symbol.toUpperCase()] = t.quotes.USD.market_cap;
    });
    console.log(`[시총 로그] CoinPaprika에서 ${res.data.length}개 티커 로드 완료`);

    // 2) DB에서 자산 목록 조회
    const assets = await findCryptoAssets(); // [{id, symbol, coin_id}, ...]

    // 3) marketCapMap 기반으로 한 번만 업데이트
    for (const asset of assets) {
      const usdCap = marketCapMap[asset.symbol] || 0;
      const krwCap = usdCap * EXCHANGE_RATE;
      const conn = await pool.getConnection();
      try {
        await conn.execute(
          `UPDATE asset_info
           SET market_cap = ?, last_updated = NOW()
           WHERE asset_id = ?`,
          [krwCap, asset.id],
        );
        console.log(`[시총 로그] ${asset.symbol} 시가총액 ${krwCap} KRW로 업데이트`);
      } finally {
        conn.release();
      }
    }
  } catch (err: any) {
    console.error("[BinanceService] updateCryptoMarketCapOnce 오류:", err.message || err);
  }
}

/**
 * 주기적 업데이트: Binance 가격·변동률 로직 그대로 두고,
 * CoinPaprika에서 한 번에 끌어온 시가총액을 함께 upsert
 */
export async function updateCryptoAssetInfoPeriodically(): Promise<void> {
  try {
    // 1) CoinPaprika 전체 티커 조회 → 시가총액 맵
    const marketCapMap: Record<string, number> = {};
    const res = await axios.get<PaprikaTicker[]>(COINPAPRIKA_TICKERS_URL);
    res.data.forEach((t: PaprikaTicker) => {
      marketCapMap[t.symbol.toUpperCase()] = t.quotes.USD.market_cap;
    });
    console.log(`[시총 로그] CoinPaprika에서 ${res.data.length}개 티커 로드 완료`);

    // 2) Binance 자산 목록 조회
    const assets = await findCryptoAssets(); // [{id, symbol, coin_id}, ...]

    // 3) Binance 24hr 티커로 가격·변동률 조회 및 upsert
    const { data: tickers } = await axios.get<BinanceTicker[]>(BINANCE_TICKER_URL);
    for (const t of tickers) {
      if (!t.symbol.endsWith("USDT")) continue;

      const symbol = t.symbol.slice(0, -4).toUpperCase();
      const asset = assets.find((a) => a.symbol === symbol);
      if (!asset) continue;

      const price = parseFloat(t.lastPrice);
      const change = parseFloat(t.priceChangePercent);
      const usdCap = marketCapMap[symbol] || 0;
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
