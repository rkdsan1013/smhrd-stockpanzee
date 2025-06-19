// /frontend/src/services/binanceService.ts
import axios from "axios";

// Binance REST/WS endpoints
const REST_ENDPOINT = "https://api.binance.com/api/v3/ticker/24hr";
const WS_BASE = "wss://stream.binance.com:9443/ws";

/**
 * 암호화폐 티커 정보 인터페이스
 */
export interface CryptoTicker {
  /** 현재 가격 */
  price: number;
  /** 24시간 변동률 (%) */
  changePercent: number;
}

/**
 * REST API를 통해 단일 암호화폐의 현재가와 24시간 변동률을 조회합니다.
 * @param symbol 암호화폐 심볼 (예: "BTC", "ETH")
 */
export async function fetchCryptoTicker(symbol: string): Promise<CryptoTicker> {
  // Binance에서는 USDT 페어로 조회
  const pair = symbol.toUpperCase().endsWith("USDT")
    ? symbol.toUpperCase()
    : `${symbol.toUpperCase()}USDT`;

  const response = await axios.get<{ lastPrice: string; priceChangePercent: string }>(
    REST_ENDPOINT,
    { params: { symbol: pair } },
  );

  return {
    price: parseFloat(response.data.lastPrice),
    changePercent: parseFloat(response.data.priceChangePercent),
  };
}

/**
 * WebSocket 스트림을 통해 실시간 암호화폐 티커 업데이트를 구독합니다.
 * @param symbol 암호화폐 심볼 (예: "BTC", "ETH")
 * @param onUpdate 가격 업데이트 콜백
 * @returns WebSocket 인스턴스 (필요 시 close() 호출)
 */
export function subscribeCryptoTicker(
  symbol: string,
  onUpdate: (data: CryptoTicker) => void,
): WebSocket {
  const pair = symbol.toLowerCase().endsWith("usdt")
    ? symbol.toLowerCase()
    : `${symbol.toLowerCase()}usdt`;

  const ws = new WebSocket(`${WS_BASE}/${pair}@ticker`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // 'c' = Close price, 'P' = Price change percent
      onUpdate({
        price: parseFloat(data.c),
        changePercent: parseFloat(data.P),
      });
    } catch (err) {
      console.error("Binance WS parse error:", err);
    }
  };

  ws.onerror = (err) => {
    console.error("Binance WS error:", err);
  };

  return ws;
}
