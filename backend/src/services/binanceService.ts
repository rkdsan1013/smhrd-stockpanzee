// /backend/src/services/binanceService.ts

import axios from "axios";
import { getAssetBySymbolAndMarket, upsertCryptoInfo } from "../models/assetModel";

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
}

/**
 * 5초 주기: BINANCE 마켓 암호화폐 현재가·변동률을 DB에 upsert
 */
export async function updateCryptoAssetInfoPeriodically(): Promise<void> {
  try {
    const { data: tickers } = await axios.get<BinanceTicker[]>(
      "https://api.binance.com/api/v3/ticker/24hr",
    );
    for (const t of tickers) {
      if (!t.symbol.endsWith("USDT")) continue;
      const symbol = t.symbol.slice(0, -4); // BTCUSDT → BTC
      const asset = await getAssetBySymbolAndMarket(symbol, "BINANCE");
      if (!asset) continue;
      const price = parseFloat(t.lastPrice);
      const change = parseFloat(t.priceChangePercent);
      await upsertCryptoInfo(asset.id, price, change);
    }
  } catch (err) {
    console.error("[BinanceService] DB 업데이트 실패:", err);
  }
}
