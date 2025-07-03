// /backend/src/socket.ts
import { Server } from "socket.io";
import http from "http";

export function setupSocket(server: http.Server): Server {
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

    socket.on("subscribeFavorites", (assetIds: number[]) => {
      assetIds.forEach((id) => socket.join(`asset_${id}`));
      console.log(`🔔 [${socket.id}] subscribed to`, assetIds);
    });

    socket.on("disconnect", () => {
      console.log("❌ 클라이언트 연결 종료:", socket.id);
    });
  });

  return io;
}
