import { Server } from "socket.io";
//import { emitStockPrices } from "./korStock";

export function setupSocket(server: any) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });

  // 주기적으로 가격 emit
  //setInterval(() => emitStockPrices(io), 5000);
}