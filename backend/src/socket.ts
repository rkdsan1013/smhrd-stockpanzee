// ✅ socket.ts
import { Server } from "socket.io";
import http from "http";
import { emitLiveStocks, updateMockStocks } from "./services/korStock";
import fs from "fs";
import path from "path";

interface StockItem {
  symbol: string;
  name: string;
  market: string;
}

const stockListPath = path.join(__dirname, "../krx_basic_info.json");
const stockList: StockItem[] = JSON.parse(fs.readFileSync(stockListPath, "utf-8"));

// ✅ 인기 종목 상위 25개 임의 선택 (거래대금 기준으로 추후 교체 가능)
const top25 = stockList
  .filter(s => s.market === "KOSPI" || s.market === "KOSDAQ")
  .slice(0, 25); // 예시로 25개만 자름

export function setupSocket(server: http.Server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("📡 클라이언트 연결됨:", socket.id);

    socket.on("disconnect", () => {
      console.log("❌ 클라이언트 연결 종료:", socket.id);
    });
  });

  // ✅ 실시간 상위 25개 종목 30초마다 전송
  setInterval(() => {
    emitLiveStocks(io, top25);
  }, 3000); // 3초 간격

  // ✅ 나머지 종목들 5분마다 조회
  setInterval(() => {
    updateMockStocks(); // DB 저장 없이 로그만 출력
  }, 5 * 60_000); // 5분 간격
}
