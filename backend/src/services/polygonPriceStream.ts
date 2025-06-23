// /backend/src/services/polygonPriceStream.ts
import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import WebSocket from "ws";
import type { Server as IOServer } from "socket.io";
import mysql from "mysql2/promise";
import * as model from "../models/assetModel";
import { upsertAssetInfo } from "../models/assetModel";
import pool from "../config/db"; // MySQL 연결 풀

// 환경변수에서 FMP_API_KEY 도 읽음
const { FMP_API_KEY } = process.env;
if (!FMP_API_KEY) {
  console.error("❌ FMP_API_KEY가 설정되어 있지 않습니다.");
  process.exit(1);
}

// 환율 상수: 1 USD = 1400 KRW (한 번만 곱함)
const DOLLAR_EXCHANGE_RATE = 1400;
console.log(`[환율 로그] 1 USD = ${DOLLAR_EXCHANGE_RATE} KRW`);

// 폴리곤 관련 상수
const POLYGON_API_KEY: string = process.env.POLYGON_API_KEY!;
const POLYGON_BASE_URL = "https://api.polygon.io";
const POLYGON_WS_URL = `wss://delayed.polygon.io/stocks`;

// 실시간 주가 관련 인터페이스
export interface PriceData {
  price: number;
  timestamp: number;
}
export const priceMap = new Map<string, PriceData>();
export function getPriceFromMemory(symbol: string): PriceData | null {
  return priceMap.get(symbol) ?? null;
}

// ──────────────────────────────────────────────
// 폴리곤 그룹화된 전일 집계 API 응답 타입
interface GroupedAgg {
  T: string; // 심볼
  o: number; // 시가 (달러)
  c: number; // 종가 (달러)
}
interface GroupedAggsResponse {
  status: string;
  results: GroupedAgg[];
}

// ──────────────────────────────────────────────
// FMP API 응답 타입 – 시가총액 정보
interface QuoteItem {
  symbol: string;
  marketCap: number;
}

// ──────────────────────────────────────────────
// 배열을 지정한 크기만큼 분할하는 유틸 함수 (FMP API용)
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ──────────────────────────────────────────────
// 최근 거래일(Trading Day) 계산 함수 (토, 일일 경우 전 거래일인 금요일 반환)
function getLastTradingDay(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1); // 기본적으로 어제 날짜
  const day = date.getDay();
  if (day === 0) {
    // 일요일
    date.setDate(date.getDate() - 2);
  } else if (day === 6) {
    // 토요일
    date.setDate(date.getDate() - 1);
  }
  return date.toISOString().slice(0, 10);
}

// ──────────────────────────────────────────────
// FMP API를 이용하여, 주어진 심볼 배열에 대해 시가총액(USD) 정보를 배치로 가져와 매핑 객체(symbol => marketCap)
// 최대 1000개씩 처리 (FMP Batch Quote API)
async function fetchMarketCapsForSymbols(symbols: string[]): Promise<Map<string, number>> {
  const marketCapMap = new Map<string, number>();
  const chunks = chunkArray(symbols, 1000);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const url = `https://financialmodelingprep.com/api/v3/quote/${chunk.join(
      ",",
    )}?apikey=${FMP_API_KEY}`;
    try {
      const resp = await axios.get<QuoteItem[]>(url);
      const data = resp.data;
      console.log(
        `\n[시총 로그] ${i + 1}/${chunks.length}차 배치: 요청 심볼 ${chunk.length}개, 반환 항목 ${data.length}`,
      );
      data.forEach((item) => {
        if (item.marketCap > 0) {
          marketCapMap.set(item.symbol.toUpperCase(), item.marketCap);
        }
      });
    } catch (error: any) {
      console.warn(
        `[시총 로그] ${i + 1}/${chunks.length}차 배치 호출 실패: ${error.message || error}`,
      );
    }
  }
  return marketCapMap;
}

// ──────────────────────────────────────────────
// 전일 종가 업데이트 함수
/**
 * 전일 종가 데이터를 폴리곤 API에서 받아와,
 * 동시에 FMP API를 통해 해당 종목의 시가총액(USD)을 불러온 후,
 * 둘 다 환율 1400을 한 번만 곱해 KRW 단위로 변환하여 DB에 저장합니다.
 */
export async function updatePreviousCloses(): Promise<void> {
  const lastTradingDay = getLastTradingDay();
  console.log(`[전일 종가 로그] Fetching data for last trading day: ${lastTradingDay}`);
  const url = `${POLYGON_BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/${lastTradingDay}?adjusted=true&apiKey=${POLYGON_API_KEY}`;
  const resp = await axios.get<GroupedAggsResponse>(url);
  const results = resp.data.results ?? [];
  console.log(
    `[전일 종가 로그] Polygon API 응답 결과 (${results.length} 건): ${JSON.stringify(results)}`,
  );

  // assets 테이블에서 관련 데이터를 가져옴
  const assets = await model.findAllAssets();
  const mapId = new Map(assets.map((a) => [a.symbol.toUpperCase(), a.id]));

  // 폴리곤 API 결과에서 업데이트할 심볼 리스트 (대문자로 변환)
  const symbolsToUpdate = Array.from(new Set(results.map((r) => r.T.toUpperCase())));
  // FMP API를 이용해 시가총액(USD) 정보 가져오기
  const marketCapMap = await fetchMarketCapsForSymbols(symbolsToUpdate);

  await Promise.all(
    results.map(async (r) => {
      const symbol = r.T.toUpperCase();
      const id = mapId.get(symbol);
      if (!id) return;
      // 주가 데이터 변환 (달러 원본 값에 환율 1400 한 번만 곱함)
      const closeKRW = r.c * DOLLAR_EXCHANGE_RATE;
      const openKRW = r.o * DOLLAR_EXCHANGE_RATE;
      const change = r.o === 0 ? 0 : Number((((closeKRW - openKRW) / openKRW) * 100).toFixed(2));
      // FMP API에서 가져온 시가총액(USD)이 있으면 환율 곱해서 사용, 없으면 0
      const marketCapUSD = marketCapMap.get(symbol) || 0;
      const marketCapKRW = marketCapUSD * DOLLAR_EXCHANGE_RATE;

      await upsertAssetInfo(id, closeKRW, change, marketCapKRW);
      // DB 저장 로그는 주석처리 → 시총 값만 별도 로그로 출력
      console.log(`[시총 로그] 자산 ID: ${id}, 심볼: ${symbol} | 시총 (KRW): ${marketCapKRW}`);
    }),
  );

  console.log("[전일 종가 로그] 전일 종가 업데이트 완료.");
}

// ──────────────────────────────────────────────
// 실시간 주가 업데이트 (폴리곤 WebSocket 이용)
/**
 * WebSocket을 통해 실시간 주가 데이터를 받아 DB에 업데이트합니다.
 * - 실시간 주가(현재가)는 달러 원본 값에 환율 1400을 한 번만 곱해 KRW 단위로 변환합니다.
 * - 시가총액은 전일 업데이트된 값을 그대로 사용합니다.
 */
export async function startPolygonPriceStream(io: IOServer) {
  // 전일 종가 업데이트 먼저 수행(시가총액 업데이트 포함)
  await updatePreviousCloses();

  // 이후 실시간 업데이트에서는 시가총액은 업데이트된 값 그대로 사용
  const assets = await model.findAllAssets();
  const idMap = new Map(assets.map((a) => [a.symbol.toUpperCase(), a.id]));

  let reconnect = 1000;
  async function connect() {
    const ws = new WebSocket(POLYGON_WS_URL);

    ws.on("open", () => {
      ws.send(JSON.stringify({ action: "auth", params: POLYGON_API_KEY }));
      const params = assets.map((a) => `AM.${a.symbol}`).join(",");
      ws.send(JSON.stringify({ action: "subscribe", params }));
      reconnect = 1000;
    });

    ws.on("message", (data) => {
      let msgs: any[];
      try {
        msgs = JSON.parse(data.toString());
      } catch {
        return;
      }
      for (const m of msgs) {
        if (m.ev === "AM" && m.sym && m.c != null) {
          const symbol = m.sym.toUpperCase();
          // 실시간 주가 데이터: 달러 원본에 환율 1400 곱함
          const priceKRW = (m.c as number) * DOLLAR_EXCHANGE_RATE;
          const timestamp = m.s as number;
          priceMap.set(symbol, { price: priceKRW, timestamp });
          io.emit("priceUpdate", { symbol, price: priceKRW, timestamp });
        }
      }
    });

    ws.on("close", async () => {
      for (const [symbol, pd] of priceMap) {
        const aid = idMap.get(symbol);
        if (!aid) continue;
        const asset = assets.find((a) => a.id === aid)!;
        const dbP = asset.current_price ?? pd.price;
        const change = dbP === 0 ? 0 : Number((((pd.price - dbP) / dbP) * 100).toFixed(2));
        // 시총은 전일 업데이트된 값을 그대로 사용
        const marketCap = asset.market_cap ?? 0;
        await upsertAssetInfo(aid, pd.price, change, marketCap);
        // DB 저장 로그 주석 처리, 대신 시총 로그 출력
        console.log(`[시총 로그] 자산 ID: ${aid} | 실시간 시가총액 (KRW): ${marketCap}`);
      }
      console.log("[실시간 로그] 실시간 주가 업데이트 완료.");
      setTimeout(connect, reconnect);
      reconnect = Math.min(reconnect * 2, 30000);
    });

    ws.on("error", (err) => {
      ws.close();
    });
  }

  connect().catch((err) => {});
}
