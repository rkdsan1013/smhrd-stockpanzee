import { Server } from "socket.io";
// import { emitStockPrices } from "./korStock";

export function setupSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    socket.on("ping", () => {
      socket.emit("pong", "서버 응답 OK");
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });

  // 아래의 시세 조회 루프를 주석 처리하여 korStock 실행을 중단합니다.
  // const startEmitLoop = async () => {
  //   while (true) {
  //     console.log("🕐 emitStockPrices 시작");
  //     await emitStockPrices(io);
  //     console.log("✅ emitStockPrices 완료 → 다음 주기 대기");
  //
  //     await new Promise((resolve) => setTimeout(resolve, 180000)); // 3분 대기
  //   }
  // };
  //
  // startEmitLoop(); // 최초 실행

  return io;
}
