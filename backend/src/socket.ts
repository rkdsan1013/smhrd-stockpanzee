import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import axios from "axios";
import { getStockList } from "./korStock";
import dotenv from "dotenv";
dotenv.config();

export function setupSocket(server: HttpServer) {
  const io = new Server(server, { cors: { origin: "*" } });

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

  // ✅ 실시간 가격 5초마다 emit
  setInterval(async () => {
    try {
      const stockList = await getStockList();

      for (const stock of stockList) {
        const token = await getAccessToken();
        const res = await axios.get(
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
              fid_input_iscd: stock.shnm,
            },
          }
        );

        io.emit("stockPrice", {
          symbol: stock.shnm,
          price: res.data.output.stck_prpr,
        });
      }
    } catch (err) {
      console.error("실시간 가격 emit 실패:", err);
    }
  }, 5000);
}

function getAccessToken() {
  throw new Error("Function not implemented.");
}
