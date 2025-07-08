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
import { emitMockTop25, updateRealToDB } from "./services/marketData/krxMarketService";
import { listAssets } from "./services/assetService";

// 뉴스 스케줄러 호출
import { startNewsScheduler } from "./services/news/newsScheduler";

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

// 정적 파일 제공
const uploadsPath = path.resolve(__dirname, "../uploads");
app.use("/api/uploads", express.static(uploadsPath));

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

// 기본 엔드포인트
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello from Express with WebSocket!");
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 실전 KRX 데이터 루프
async function startKrXRealLoop(io: ReturnType<typeof setupSocket>) {
  while (true) {
    console.log("🚀 실전 KRX 종목 수집 및 브로드캐스트 시작");
    await updateRealToDB();

    const assets = await listAssets();
    assets.forEach((a) => {
      io.to(`asset_${a.id}`).emit("stockPrice", {
        assetId: a.id,
        symbol: a.symbol,
        priceChange: a.priceChange,
      });
    });

    console.log("✅ KRX 실전 데이터 emit 완료 → 5초 대기");
    await sleep(5000);
  }
}

async function start() {
  const server = http.createServer(app);
  const io = setupSocket(server);

  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // // KRX 실전 데이터 루프
    // startKrXRealLoop(io).catch(console.error);

    // // 모의투자 상위 25개 종목 emit
    // emitMockTop25(io).catch(console.error);

    // // Polygon 실시간 주가 스트림 (옵션)
    // // startPolygonPriceStream(io).catch(console.error);

    // // 암호화폐 DB 업데이트 주기 (옵션)
    // setInterval(updateCryptoAssetInfoPeriodically, 5000);

    // // 뉴스 스케줄러 시작
    // startNewsScheduler();
  });
}

start();
