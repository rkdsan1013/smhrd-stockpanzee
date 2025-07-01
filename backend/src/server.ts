// /backend/src/server.ts
import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { setupSocket } from "./socket";
import { startPolygonPriceStream } from "./services/marketData/usStockMarketService";
import { updateCryptoAssetInfoPeriodically } from "./services/marketData/cryptoMarketService";
import { emitStockPrices } from "./services/marketData/krxMarketService";

// 1) 뉴스 스케줄러를 import만 하면 즉시 등록됩니다.
//    services/news/newsScheduler.ts 에서 node-cron 으로
//    국내(10분), 해외(1시간), 암호화폐(10분) 수집을 자동 실행합니다.
import "./services/news/newsScheduler";

import authRoutes from "./routes/authRoutes";
import assetsRoutes from "./routes/assetsRoutes";
import newsRoutes from "./routes/newsRoutes";
import communityRoutes from "./routes/communityRoutes";
import redditRoutes from "./routes/redditRoutes";
import chatbotRoutes from "./routes/chatbotRoutes";
import userRoutes from "./routes/userRoutes";
import favoriteRouter from "./routes/favoriteRoutes";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/assets", assetsRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/reddit", redditRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/user", userRoutes);
app.use("/api/favorites", favoriteRouter);

console.log("STATIC PATH:", path.resolve(__dirname, "../uploads"));
app.use("/uploads", express.static(path.resolve(__dirname, "../uploads")));

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello from Express with WebSocket!");
});

const server = http.createServer(app);
const io = setupSocket(server);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.statusCode ?? 500).json({ message: err.message ?? "서버 오류" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // (옵션) 실시간 폴리곤 주가 스트림
  // startPolygonPriceStream(io).catch((err) => console.error("Failed to start Polygon:", err));

  // (옵션) Binance 암호화폐 5초 주기 DB 업데이트
  setInterval(updateCryptoAssetInfoPeriodically, 5000);

  // (옵션) KRX 실시간 주가 emit
  // emitStockPrices(io)
  //   .then(() => console.log("🟢 emitStockPrices started"))
  //   .catch((err) => console.error("❌ emitStockPrices failed:", err));
});
