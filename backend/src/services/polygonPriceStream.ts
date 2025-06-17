import dotenv from "dotenv";
dotenv.config();

import WebSocket from "ws";

const POLYGON_API_KEY = process.env.POLYGON_API_KEY!;
console.log("✅ [DEBUG] POLYGON_API_KEY =", POLYGON_API_KEY);
const POLYGON_WS_URL = `wss://delayed.polygon.io/stocks`;

interface PriceData {
  price: number;
  timestamp: number;
}

const priceMap: Map<string, PriceData> = new Map();

export const getPriceFromMemory = (symbol: string): PriceData | null => {
  return priceMap.get(symbol) ?? null;
};

export const startPolygonPriceStream = async () => {
  console.log("[Polygon] Connecting to WebSocket...");
  const socket = new WebSocket(POLYGON_WS_URL);

  socket.on("open", () => {
    console.log("[Polygon] WebSocket connected");

    socket.send(JSON.stringify({ action: "auth", params: POLYGON_API_KEY }));
    console.log("[Polygon] Auth request sent");

    // ✅ 테스트용 심볼만 구독 (AAPL, MSFT, GOOG)
    const testSymbols = ["AAPL", "MSFT", "GOOG"];
    const paramStr = testSymbols.map((sym) => `AM.${sym}`).join(",");
    socket.send(JSON.stringify({ action: "subscribe", params: paramStr }));
    console.log(`[Polygon] Subscribed to test symbols: ${paramStr}`);
  });

  socket.on("message", (data: WebSocket.RawData) => {
    const raw = data.toString();

    try {
      const messages = JSON.parse(raw);

      for (const msg of messages) {
        if (msg.ev === "AM") {
          const symbol = msg.sym;
          const price = msg.c;
          const timestamp = msg.s;

          priceMap.set(symbol, { price, timestamp });
          console.log(`[PRICE-AM] ${symbol} → ${price}`);
        } else if (msg.ev === "status") {
          console.log(`[STATUS] ${msg.status}: ${msg.message}`);
        } else {
          console.log("[DEBUG] Unhandled message:", msg);
        }
      }
    } catch (err) {
      console.error("[WS] Failed to parse message:", raw);
    }
  });

  socket.on("error", (err: unknown) => {
    console.error("[Polygon] WebSocket error:", err);
  });

  socket.on("close", () => {
    console.warn("[Polygon] WebSocket closed. Reconnecting in 5s...");
    setTimeout(startPolygonPriceStream, 5000);
  });
};
