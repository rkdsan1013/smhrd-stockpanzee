// /backend/src/socket.ts
import { Server } from "socket.io";
import { Server as HttpServer } from "http";

export function setupSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(`🟢 User connected: ${socket.id}`);

    socket.on("message", (msg) => {
      console.log(`📩 Received message: ${msg}`);
      io.emit("message", msg);
    });

    socket.on("disconnect", () => {
      console.log(`🔴 User disconnected: ${socket.id}`);
    });
  });

  return io;
}
