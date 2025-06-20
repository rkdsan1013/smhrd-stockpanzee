// /frontend/src/hooks/useCryptoPrices.ts
import { useEffect, useState, useRef } from "react";
import { fetchCryptoTicker, subscribeCryptoTicker } from "../services/binanceService";
import type { CryptoTicker } from "../services/binanceService";

/**
 * 암호화폐 심볼 리스트를 받아 REST로 초기 로드,
 * WS로 실시간 업데이트된 가격을 제공하는 커스텀 훅
 *
 * @param symbols 암호화폐 심볼 리스트 (예: ['BTCUSDT', 'ETHUSDT'])
 * @returns symbol -> { price, changePercent } 매핑 객체
 */
export function useCryptoPrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, CryptoTicker>>({});
  const wsRefs = useRef<Record<string, WebSocket>>({});

  // REST로 초기 조회
  useEffect(() => {
    symbols.forEach((sym) => {
      fetchCryptoTicker(sym)
        .then((t) =>
          setPrices((prev) => ({
            ...prev,
            [sym]: t,
          })),
        )
        .catch(console.error);
    });
  }, [symbols]);

  // WS로 실시간 구독
  useEffect(() => {
    symbols.forEach((sym) => {
      if (wsRefs.current[sym]) return;
      const ws = subscribeCryptoTicker(sym, (ticker) => {
        setPrices((prev) => ({
          ...prev,
          [sym]: ticker,
        }));
      });
      wsRefs.current[sym] = ws;
    });

    return () => {
      Object.values(wsRefs.current).forEach((ws) => ws.close());
      wsRefs.current = {};
    };
  }, [symbols]);

  return prices;
}
