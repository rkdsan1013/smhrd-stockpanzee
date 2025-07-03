// /backend/src/server.ts
import express, { Request, Response } from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";

import { setupSocket } from "./socket";
import { startPolygonPriceStream } from "./services/marketData/usStockMarketService";
import { updateCryptoAssetInfoPeriodically } from "./services/marketData/cryptoMarketService";
import { emitMockTop25 } from "./services/marketData/krxMarketService";

// 뉴스 스케줄러 import
import "./services/news/newsScheduler";

import authRoutes from "./routes/authRoutes";
import assetsRoutes from "./routes/assetsRoutes";
import newsRoutes from "./routes/newsRoutes";
import communityRoutes from "./routes/communityRoutes";
import redditRoutes from "./routes/redditRoutes";
import chatbotRoutes from "./routes/chatbotRoutes";
import userRoutes from "./routes/userRoutes";
import favoriteRouter from "./routes/favoriteRoutes";
import notificationRoutes from "./routes/notificationRoutes";

dotenv.config();

const app = express();

// 미들웨어
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// API 라우터
app.use("/api/auth", authRoutes);
app.use("/api/assets", assetsRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/reddit", redditRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/user", userRoutes);
app.use("/api/favorites", favoriteRouter);
app.use("/api", notificationRoutes);

// 정적 파일 제공: /api/uploads/*
const uploadsPath = path.resolve(__dirname, "../uploads");
console.log("Serving uploads from:", uploadsPath);
app.use("/api/uploads", express.static(uploadsPath));

// 기본 경로
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello from Express with WebSocket!");
});

// 서버 + 소켓 실행
async function start() {
  const server = http.createServer(app);
  const io = await setupSocket(server);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // (옵션) Polygon 실시간 주가
    // startPolygonPriceStream(io).catch((err) => console.error(err));

    // (옵션) 암호화폐 DB 업데이트
    // setInterval(updateCryptoAssetInfoPeriodically, 5000);

    // (옵션) KRX 주가 emit
    // emitMockTop25(io).then(() => console.log("KRX emit started"));
  });
}

start();
