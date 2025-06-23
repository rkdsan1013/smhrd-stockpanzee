// /backend/src/services/polygonPriceStream.ts
import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import WebSocket from "ws";
import type { Server as IOServer } from "socket.io";
import * as model from "../models/assetModel";
import { upsertAssetInfo } from "../models/assetModel";

// 임시 상수: 달러 환율 (1 USD = 1400 KRW)
const DOLLAR_EXCHANGE_RATE = 1400;
// [환율 로그] 환율 정보 출력
console.log(`[환율 로그] 1 USD = ${DOLLAR_EXCHANGE_RATE} KRW`);

const POLYGON_API_KEY = process.env.POLYGON_API_KEY!;
const POLYGON_BASE_URL = "https://api.polygon.io";
const POLYGON_WS_URL = `wss://delayed.polygon.io/stocks`;

export interface PriceData {
  price: number;
  timestamp: number;
}
export const priceMap = new Map<string, PriceData>();
export function getPriceFromMemory(symbol: string): PriceData | null {
  return priceMap.get(symbol) ?? null;
}

// 그룹화된 전일 집계 응답 타입
interface GroupedAgg {
  T: string;
  o: number;
  c: number;
}
interface GroupedAggsResponse {
  status: string;
  results: GroupedAgg[];
}

/**
 * 최근 거래일(Trading Day)을 구하는 함수
 * - 월요일이면 전일(일요일)이 아니라 금요일을 반환
 */
function getLastTradingDay(): string {
  const date = new Date();
  // 어제 날짜로 설정
  date.setDate(date.getDate() - 1);
  // US 주식시장은 토, 일요일에 휴장하므로,
  // 어제 날짜가 토요일이면 하루 더 빼서 금요일, 일요일이면 2일 빼서 금요일로 지정
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

/**
 * 전일 종가를 한번에 불러와 DB에 저장
 */
export async function updatePreviousCloses(): Promise<void> {
  const lastTradingDay = getLastTradingDay();
  console.log(`[전일 종가 로그] Fetching data for last trading day: ${lastTradingDay}`);
  const url = `${POLYGON_BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/${lastTradingDay}?adjusted=true&apiKey=${POLYGON_API_KEY}`;
  const resp = await axios.get<GroupedAggsResponse>(url);
  const results = resp.data.results ?? [];

  // [전일 종가 로그] API 응답 로그
  console.log(`[전일 종가 로그] API 응답 결과 (${results.length} 건): ${JSON.stringify(results)}`);

  const assets = await model.findAllAssets();
  const mapId = new Map(assets.map((a) => [a.symbol, a.id]));

  await Promise.all(
    results.map(async (r) => {
      const id = mapId.get(r.T);
      if (!id) return;

      // 달러 가격을 원화로 변환
      const closeKRW = r.c * DOLLAR_EXCHANGE_RATE;
      const openKRW = r.o * DOLLAR_EXCHANGE_RATE;
      // 만약 openKRW가 0이면 변동률을 0으로 처리
      const change =
        openKRW === 0 ? 0 : Number((((closeKRW - openKRW) / openKRW) * 100).toFixed(2));

      // DB에 저장된 시총도 환율을 곱해 원화 단위로 변환
      const asset = assets.find((a) => a.id === id);
      const existingCap = asset?.market_cap ?? 0;
      const marketCapKRW = existingCap * DOLLAR_EXCHANGE_RATE;

      await upsertAssetInfo(id, closeKRW, change, marketCapKRW);
      // [DB 저장 로그] 환율 적용 및 DB 저장 관련 로그 출력
      console.log(
        `[DB 저장 로그] 자산 ID: ${id} | 원달러 환율: ${DOLLAR_EXCHANGE_RATE} | 전일 종가 (KRW): ${closeKRW} | 전일 시가 (KRW): ${openKRW} | 변동률: ${change}% | 시총 (KRW): ${marketCapKRW}`,
      );
    }),
  );
  // console.log(`✔ Updated ${results.length} previous closes`);
}

/**
 * WS 스트림 시작, 실시간 틱 처리 및 장 마감 시 DB 동기화
 */
export async function startPolygonPriceStream(io: IOServer) {
  // 1) 전일 종가 일괄 로드
  await updatePreviousCloses();
  // console.log("✔ Previous closes loaded");

  // 2) symbol ↔ assetId 맵 구성
  const assets = await model.findAllAssets();
  const idMap = new Map(assets.map((a) => [a.symbol, a.id]));

  let reconnect = 1000;
  async function connect() {
    const ws = new WebSocket(POLYGON_WS_URL);

    ws.on("open", () => {
      ws.send(JSON.stringify({ action: "auth", params: POLYGON_API_KEY }));
      const params = assets.map((a) => `AM.${a.symbol}`).join(",");
      ws.send(JSON.stringify({ action: "subscribe", params }));
      // console.log(`[Polygon] Subscribed: ${params}`);
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
          const symbol = m.sym as string;
          // 달러 가격을 원화로 변환
          const priceKRW = (m.c as number) * DOLLAR_EXCHANGE_RATE;
          const timestamp = m.s as number;

          priceMap.set(symbol, { price: priceKRW, timestamp });
          io.emit("priceUpdate", { symbol, price: priceKRW, timestamp });
        }
      }
    });

    ws.on("close", async () => {
      // console.log("[Polygon] WS closed, persisting last prices");
      for (const [symbol, pd] of priceMap) {
        const aid = idMap.get(symbol);
        if (!aid) continue;
        const asset = assets.find((a) => a.id === aid)!;
        const dbP = asset.current_price ?? pd.price;
        // 만약 dbP가 0이면 변동률을 0으로 처리
        const change = dbP === 0 ? 0 : Number((((pd.price - dbP) / dbP) * 100).toFixed(2));
        const existingCap = asset.market_cap ?? 0;
        const marketCapKRW = existingCap * DOLLAR_EXCHANGE_RATE;
        await upsertAssetInfo(aid, pd.price, change, marketCapKRW);
        // [DB 저장 로그] 실시간 가격 DB 저장 관련 로그 출력
        console.log(
          `[DB 저장 로그] 자산 ID: ${aid} | 실시간 종가 (KRW): ${pd.price} | 변동률: ${change}% | 시총 (KRW): ${marketCapKRW}`,
        );
      }
      setTimeout(connect, reconnect);
      reconnect = Math.min(reconnect * 2, 30000);
    });

    ws.on("error", (err) => {
      // console.error(err);
      ws.close();
    });
  }

  connect().catch((err) => {
    // console.error("[Polygon] Stream failed:", err);
  });
}
