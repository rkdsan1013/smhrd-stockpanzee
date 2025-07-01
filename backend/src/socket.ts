import { Server } from "socket.io";
import http from "http";
import { emitMockTop25, updateRealToDB } from "./services/korStock";
import pool from "./config/db";

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function setupSocket(server: http.Server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("📡 클라이언트 연결됨:", socket.id);

    socket.on("stockPrice", (data) => {
      io.emit("stockPrice", data);
    });

    socket.on("disconnect", () => {
      console.log("❌ 클라이언트 연결 종료:", socket.id);
    });
  });

  // ✅ 실전 종목 저장 루프 실행 (무한 순차)
  const startRealDataLoop = async () => {
    while (true) {
      console.log("🚀 실전 종목 수집 루프 시작");
      await updateRealToDB();
      console.log("✅ 수집 완료 → 5분 대기 후 재시작");
      await sleep(5_000);
    }
  };
  startRealDataLoop(); // ⏱ 서버 시작 시 즉시 시작

  // ✅ 모의투자 실시간 emit (자체 무한 루프)
  console.log("📡 emitMockTop25() 시작됨");
  emitMockTop25(io);

  return io;
}
