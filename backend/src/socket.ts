// /backend/src/socket.ts

import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

interface StockPrice {
  symbol: string;
  price: number;
}

const subscribedSymbols: Set<string> = new Set();

async function getAccessToken() {
  const res = await axios.post(
    "https://openapi.koreainvestment.com:9443/oauth2/tokenP",
    {
      grant_type: "client_credentials",
      appkey: process.env.APP_KEY,
      appsecret: process.env.APP_SECRET,
    },
    { headers: { "content-type": "application/json" } }
  );
  return res.data.access_token;
}

async function getStockPrice(code: string): Promise<number> {
  const token = await getAccessToken();

  const response = await axios.get(
    "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price",
    {
      headers: {
        authorization: `Bearer ${token}`,
        appkey: process.env.APP_KEY!,
        appsecret: process.env.APP_SECRET!,
        tr_id: "FHKST01010100",
      },
      params: {
        fid_cond_mrkt_div_code: "J",
        fid_input_iscd: code,
      },
    }
  );

  return parseFloat(response.data.output.stck_prpr);
}

export function setupSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(`🟢 User connected: ${socket.id}`);

    socket.on("subscribe", (symbol: string) => {
      console.log(`➕ Subscribed: ${symbol}`);
      subscribedSymbols.add(symbol);
    });

    socket.on("unsubscribe", (symbol: string) => {
      console.log(`➖ Unsubscribed: ${symbol}`);
      subscribedSymbols.delete(symbol);
    });

    socket.on("disconnect", () => {
      console.log(`🔴 User disconnected: ${socket.id}`);
    });
  });

  // 실시간 데이터 주기적으로 송출 (ex. 3초마다)
  setInterval(async () => {
    for (const symbol of subscribedSymbols) {
      try {
        const price = await getStockPrice(symbol);
        const data: StockPrice = { symbol, price };
        io.emit("stockPrice", data);
        console.log(`📊 Sent price for ${symbol}: ${price}`);
      } catch (err) {
        console.error(`🚨 Error fetching price for ${symbol}:`, err);
      }
    }
  }, 3000);

  return io;
}