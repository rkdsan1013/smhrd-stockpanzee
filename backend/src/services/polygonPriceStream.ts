// /backend/src/services/polygonPriceStream.ts
import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import WebSocket from "ws";
import type { Server as IOServer } from "socket.io";
import * as model from "../models/assetModel";
import { upsertAssetInfo } from "../models/assetModel";

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
 * 전일 종가를 한번에 불러와 DB에 저장
 */
export async function updatePreviousCloses(): Promise<void> {
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const url = `${POLYGON_BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/${yesterday}?adjusted=true&apiKey=${POLYGON_API_KEY}`;
  const resp = await axios.get<GroupedAggsResponse>(url);
  const results = resp.data.results ?? [];
  const assets = await model.findAllAssets();
  const mapId = new Map(assets.map((a) => [a.symbol, a.id]));

  await Promise.all(
    results.map(async (r) => {
      const id = mapId.get(r.T);
      if (!id) return;
      const close = r.c;
      const open = r.o;
      const change = open ? Number((((close - open) / open) * 100).toFixed(2)) : 0;
      await upsertAssetInfo(id, close, change, 0);
    }),
  );
  console.log(`✔ Updated ${results.length} previous closes`);
}

/**
 * WS 스트림 시작, 실시간 틱 처리 및 장 마감 시 DB 동기화
 */
export async function startPolygonPriceStream(io: IOServer) {
  // 1) 전일 종가 일괄 로드
  await updatePreviousCloses();
  console.log("✔ Previous closes loaded");

  // 2) symbol ↔ assetId 맵
  const assets = await model.findAllAssets();
  const idMap = new Map(assets.map((a) => [a.symbol, a.id]));

  let reconnect = 1000;
  async function connect() {
    const ws = new WebSocket(POLYGON_WS_URL);

    ws.on("open", () => {
      ws.send(JSON.stringify({ action: "auth", params: POLYGON_API_KEY }));
      const params = assets.map((a) => `AM.${a.symbol}`).join(",");
      ws.send(JSON.stringify({ action: "subscribe", params }));
      console.log(`[Polygon] Subscribed: ${params}`);
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
          const price = m.c as number;
          const timestamp = m.s as number;

          priceMap.set(symbol, { price, timestamp });
          io.emit("priceUpdate", { symbol, price, timestamp });
        }
      }
    });

    ws.on("close", async () => {
      console.log("[Polygon] WS closed, persisting last prices");
      for (const [symbol, pd] of priceMap) {
        const aid = idMap.get(symbol);
        if (!aid) continue;
        const asset = assets.find((a) => a.id === aid)!;
        const dbP = asset.current_price ?? pd.price;
        const change = dbP ? Number((((pd.price - dbP) / dbP) * 100).toFixed(2)) : 0;
        await upsertAssetInfo(aid, pd.price, change, 0);
      }
      setTimeout(connect, reconnect);
      reconnect = Math.min(reconnect * 2, 30000);
    });

    ws.on("error", (err) => {
      console.error(err);
      ws.close();
    });
  }

  connect().catch((err) => console.error("[Polygon] Stream failed:", err));
}
