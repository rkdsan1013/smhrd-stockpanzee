// /backend/src/services/marketData/usStockMarketService.ts
import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import WebSocket from "ws";
import type { Server as IOServer } from "socket.io";
import { upsertAssetInfo, findStockAssets } from "../../models/assetModel";
import { getExchangeRate } from "../../utils/exchangeRate";

// env 체크
const { FMP_API_KEY, POLYGON_API_KEY } = process.env;
if (!FMP_API_KEY) {
  console.error("❌ FMP_API_KEY가 설정되어 있지 않습니다.");
  process.exit(1);
}
if (!POLYGON_API_KEY) {
  console.error("❌ POLYGON_API_KEY가 설정되어 있지 않습니다.");
  process.exit(1);
}

const POLYGON_BASE_URL = "https://api.polygon.io";
const POLYGON_WS_URL = "wss://delayed.polygon.io/stocks";

// —————— Helper Interfaces ——————
interface GroupedAgg {
  T: string; // 심볼
  o: number; // 시가
  c: number; // 종가
}
interface GroupedAggsResponse {
  status: string;
  results: GroupedAgg[];
}

interface QuoteItem {
  symbol: string;
  marketCap: number;
}

// —————— Helper Functions ——————
/** 배열을 size만큼 분할 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

/** 전 거래일(영업일) yyyy-MM-dd */
function getLastTradingDay(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const day = d.getDay();
  if (day === 0) d.setDate(d.getDate() - 2);
  if (day === 6) d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** FMP로 심볼별 시가총액(USD) 조회 */
async function fetchMarketCapsForSymbols(symbols: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  const batches = chunkArray(symbols, 1000);
  for (const [i, batch] of batches.entries()) {
    const url = `https://financialmodelingprep.com/api/v3/quote/${batch.join(
      ",",
    )}?apikey=${FMP_API_KEY}`;
    try {
      const { data } = await axios.get<QuoteItem[]>(url);
      console.log(
        `[시총] ${i + 1}/${batches.length} 배치, 요청 ${batch.length}개, 응답 ${data.length}개`,
      );
      data.forEach((item) => {
        if (item.marketCap > 0) map.set(item.symbol.toUpperCase(), item.marketCap);
      });
    } catch (e: any) {
      console.warn(`[시총] ${i + 1}번째 호출 실패: ${e.message}`);
    }
  }
  return map;
}

// —————— 전일 종가 + 시총 업데이트 ——————
export async function updatePreviousCloses(): Promise<void> {
  const lastDay = getLastTradingDay();
  console.log(`[전일] ${lastDay} 데이터 가져오는 중…`);

  // 1) 폴리곤 전일 집계
  const urlAggs = `${POLYGON_BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/${lastDay}?adjusted=true&apiKey=${POLYGON_API_KEY}`;
  const resp = await axios.get<GroupedAggsResponse>(urlAggs);
  const aggs: GroupedAgg[] = resp.data.results ?? [];

  // 2) 시총(USD) 조회
  const symbols = aggs.map((g) => g.T.toUpperCase());
  const marketCapMap = await fetchMarketCapsForSymbols([...new Set(symbols)]);

  // 3) 환율
  const usdToKrw = await getExchangeRate("USD", "KRW");
  console.log(`[환율] 1 USD = ${usdToKrw} KRW`);

  // 4) DB upsert
  const assets = await findStockAssets();
  const idMap = new Map(assets.map((a) => [a.symbol.toUpperCase(), a.id]));

  await Promise.all(
    aggs.map(async (g: GroupedAgg) => {
      const sym = g.T.toUpperCase();
      const id = idMap.get(sym);
      if (!id) return;

      const openKRW = g.o * usdToKrw;
      const closeKRW = g.c * usdToKrw;
      const change = g.o === 0 ? 0 : Number((((closeKRW - openKRW) / openKRW) * 100).toFixed(2));

      const capUSD = marketCapMap.get(sym) ?? 0;
      const capKRW = capUSD * usdToKrw;

      await upsertAssetInfo(id, closeKRW, change, capKRW);
      console.log(`[업데이트] ${sym} 시총 KRW ${capKRW.toLocaleString()}`);
    }),
  );

  console.log("[전일] 업데이트 완료");
}

// —————— 실시간 스트림 ——————
export async function startPolygonPriceStream(io: IOServer) {
  // 1) 전일 종가 먼저
  await updatePreviousCloses();

  // 2) 자산·ID 맵
  const assets = await findStockAssets();
  const idMap = new Map(assets.map((a) => [a.symbol.toUpperCase(), a.id]));

  let reconnect = 1000;
  priceMap.clear();

  async function connect() {
    const ws = new WebSocket(POLYGON_WS_URL);

    ws.on("open", () => {
      ws.send(JSON.stringify({ action: "auth", params: POLYGON_API_KEY }));
      const param = assets.map((a) => `AM.${a.symbol}`).join(",");
      ws.send(JSON.stringify({ action: "subscribe", params: param }));
      reconnect = 1000;
    });

    ws.on("message", async (buf: WebSocket.Data) => {
      let msgs: any[];
      try {
        msgs = JSON.parse(buf.toString());
      } catch {
        return;
      }
      const usdToKrw = await getExchangeRate("USD", "KRW");

      for (const m of msgs) {
        if (m.ev === "AM" && m.sym && typeof m.c === "number") {
          const sym = m.sym.toUpperCase();
          const priceKRW = m.c * usdToKrw;
          priceMap.set(sym, { price: priceKRW, timestamp: m.s });
          io.emit("priceUpdate", { symbol: sym, price: priceKRW, timestamp: m.s });
        }
      }
    });

    ws.on("close", async () => {
      for (const [sym, pd] of priceMap) {
        const aid = idMap.get(sym);
        if (!aid) continue;
        const asset = assets.find((a) => a.id === aid)!;
        const prev = asset.current_price ?? pd.price;
        const change = prev === 0 ? 0 : Number((((pd.price - prev) / prev) * 100).toFixed(2));
        const cap = asset.market_cap ?? 0;
        await upsertAssetInfo(aid, pd.price, change, cap);
      }
      console.log("[실시간] 연결 종료, 재접속 시도 중…");
      setTimeout(connect, reconnect);
      reconnect = Math.min(reconnect * 2, 30000);
    });

    ws.on("error", () => ws.close());
  }

  connect().catch(console.error);
}

// 메모리 캐시
export interface PriceData {
  price: number;
  timestamp: number;
}
export const priceMap = new Map<string, PriceData>();
export function getPriceFromMemory(symbol: string): PriceData | null {
  return priceMap.get(symbol) ?? null;
}
