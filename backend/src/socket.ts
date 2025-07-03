import { Server } from "socket.io";
import http from "http";
import { emitMockTop25, updateRealToDB } from "./services/marketData/krxMarketService";
import { listAssets } from "./services/assetService";

// 기존 sleep 함수
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

    // 기존 stockPrice 리슨 → 모든 클라이언트 브로드캐스트
    socket.on("stockPrice", (data) => {
      io.emit("stockPrice", data);
    });

    // 즐겨찾기 자산 룸 구독
    socket.on("subscribeFavorites", (assetIds: number[]) => {
      assetIds.forEach((id) => {
        const room = `asset_${id}`;
        socket.join(room);
      });
      console.log(`🔔 [${socket.id}] subscribed to`, assetIds);
    });

    socket.on("disconnect", () => {
      console.log("❌ 클라이언트 연결 종료:", socket.id);
    });
  });

  // 실전 데이터 루프 → updateRealToDB + listAssets 통합
  const startRealDataLoop = async () => {
    while (true) {
      console.log("🚀 실전 종목 수집 및 브로드캐스트 루프 시작");
      // DB에 KRX 실시간 데이터 반영
      await updateRealToDB();

      // DB + 메모리 캐시 결합된 모든 자산 정보 조회
      const assets = await listAssets();

      // 각 자산별로 해당 룸에 stockPrice 이벤트 전송
      assets.forEach((a) => {
        const update = {
          assetId: a.id,
          symbol: a.symbol,
          priceChange: a.priceChange,
        };
        const room = `asset_${a.id}`;
        io.to(room).emit("stockPrice", update);
      });

      console.log("✅ 모든 자산 업데이트 emit 완료 → 5초 대기");
      await sleep(5000);
    }
  };

  startRealDataLoop();

  // 기존 모의 데이터 emit 유지
  console.log("📡 emitMockTop25() 시작됨");
  emitMockTop25(io);

  return io;
}
