import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import axios from "axios";
import { getStockList, getAccessToken } from "./korStock";
import dotenv from "dotenv";
dotenv.config();

export function setupSocket(server: HttpServer) {
  const io = new Server(server, { cors: { origin: "*" } });

  io.on("connection", (socket) => {
    console.log(`🟢 User connected: ${socket.id}`);

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
              fid_input_iscd: stock.shrn_iscd,  // ✅ 핵심 수정 포인트
            },
          }
        );

        io.emit("stockPrice", {
          symbol: stock.shrn_iscd,  // 종목코드 기준으로
          price: res.data.output.stck_prpr,
        });
      }
    } catch (err) {
      console.error("실시간 가격 emit 실패:", err);
    }
  }, 5000);
}