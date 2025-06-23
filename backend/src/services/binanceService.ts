// /backend/src/services/binanceService.ts

import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import WebSocket from "ws";
import type { Server as IOServer } from "socket.io";
import {
  getAssetBySymbolAndMarket,
  upsertCryptoInfo,
  findCryptoAssets,
} from "../models/assetModel";
import pool from "../config/db";

// cSpell:ignore binancecoin cardano polkadot dogecoin litecoin chainlink solana
// 환율 상수: 1 USD = 1400 KRW (한 번만 곱함)
const EXCHANGE_RATE = 1400;
console.log(`[환율 로그] 1 USD = ${EXCHANGE_RATE} KRW`);

// Binance API 엔드포인트
const BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/24hr";

// CoinGecko API 기본 URL
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/coins/markets";

// ------------------------------------------------------------------------------
// Binance 티커 API 응답 타입
interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
}

// DB 업데이트 쿼리: asset_info의 market_cap을 업데이트 (market_cap이 NULL 또는 0일 때만)
const UPDATE_CRYPTO_MARKET_CAP = `
  UPDATE asset_info
  SET market_cap = ?, last_updated = NOW()
  WHERE asset_id = ? AND (market_cap IS NULL OR market_cap = 0)
`;

/**
 * updateCryptoMarketCapOnce()
 *
 * DB의 Binance 자산 정보를 조회하여, 각 자산의 심볼과 name을 이용해 CoinGecko API에 전달할 coinId(= asset.name.toLowerCase())를 구성합니다.
 * CoinGecko API를 통해 시가총액(USD)을 받아오고, 환율 1400을 곱해 KRW로 변환한 값을
 * DB의 asset_info 테이블에서 market_cap이 등록되지 않은 자산에 대해 업데이트합니다.
 */
export async function updateCryptoMarketCapOnce(): Promise<void> {
  try {
    // DB에서 Binance 시장 자산 조회
    const assets = await findCryptoAssets();
    // 자산 매핑: key = asset.symbol (대문자), value = { id, coinId } (coinId는 asset.name.trim().toLowerCase())
    const assetMapping: { [symbol: string]: { id: number; coinId: string } } = {};
    assets.forEach((asset) => {
      assetMapping[asset.symbol.toUpperCase()] = {
        id: asset.id,
        coinId: asset.name.trim().toLowerCase(),
      };
    });
    // 고유 coinId 배열
    const coinIds = Array.from(new Set(Object.values(assetMapping).map((item) => item.coinId)));
    const cgUrl = `${COINGECKO_API_URL}?vs_currency=usd&ids=${coinIds.join(",")}`;
    const cgResponse = await axios.get<any[]>(cgUrl);
    const cgData = cgResponse.data;
    // 매핑: CoinGecko ID (소문자) -> marketCapUSD
    const marketCapData: { [coinId: string]: number } = {};
    cgData.forEach((coin) => {
      if (coin.market_cap) {
        marketCapData[coin.id.toLowerCase()] = coin.market_cap;
      }
    });
    console.log(`[시총 로그] CoinGecko API returned ${cgData.length} items.`);

    // 각 자산에 대해, DB에서 market_cap이 미등록(0 또는 NULL)인 경우에만 업데이트
    for (const [symbol, { id, coinId }] of Object.entries(assetMapping)) {
      const asset = await getAssetBySymbolAndMarket(symbol, "Binance");
      if (!asset) continue;
      if (asset.market_cap && asset.market_cap > 0) continue; // 이미 시가총액 업데이트된 경우는 건너뜀
      const marketCapUSD = marketCapData[coinId] || 0;
      const marketCapKRW = marketCapUSD * EXCHANGE_RATE;
      const conn = await pool.getConnection();
      try {
        await conn.execute(UPDATE_CRYPTO_MARKET_CAP, [marketCapKRW, asset.id]);
        console.log(
          `[시총 로그] Updated asset ID: ${asset.id} (${symbol}) | Market Cap (KRW): ${marketCapKRW}`,
        );
      } catch (err: any) {
        console.error(`[시총 로그] Update failed for asset ID: ${asset.id}: ${err.message || err}`);
      } finally {
        conn.release();
      }
    }
  } catch (error: any) {
    console.error("[BinanceService] Market Cap update failed:", error.message || error);
  }
}

/**
 * updateCryptoAssetInfoPeriodically()
 *
 * Binance의 24hr 티커 API를 호출하여 암호화폐의 현재가와 가격 변동률을 업데이트합니다.
 * 이때, 기존에 등록된 시가총액(market_cap)은 변경하지 않습니다.
 */
export async function updateCryptoAssetInfoPeriodically(): Promise<void> {
  try {
    const { data: tickers } = await axios.get<BinanceTicker[]>(BINANCE_TICKER_URL);
    for (const t of tickers) {
      if (!t.symbol.endsWith("USDT")) continue;
      const symbol = t.symbol.slice(0, -4).toUpperCase();
      const asset = await getAssetBySymbolAndMarket(symbol, "Binance");
      if (!asset) continue;
      const price = parseFloat(t.lastPrice);
      const change = parseFloat(t.priceChangePercent);
      const marketCap = asset.market_cap || 0; // 기존 시가총액을 그대로 사용
      await upsertCryptoInfo(asset.id, price, change, marketCap);
    }
  } catch (error: any) {
    console.error("[BinanceService] Price update failed:", error.message || error);
  }
}
