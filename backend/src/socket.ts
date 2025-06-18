import { Server } from "socket.io";
import { emitStockPrices } from "./korStock";

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

  // ✅ 실시간 주가 주기 실행
  setInterval(() => emitStockPrices(io), 180000); // 30초마다
}
