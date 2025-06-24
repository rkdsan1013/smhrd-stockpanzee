import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";

import { setupSocket } from "./socket";
import { startPolygonPriceStream } from "./services/polygonPriceStream";
// **경로를 꼭 이대로 유지하세요** (src/services 가 아닌 ./services)
import { updateCryptoAssetInfoPeriodically } from "./services/binanceService";

import authRoutes from "./routes/authRoutes";
import assetsRoutes from "./routes/assetsRoutes";

import newsRoutes from "./routes/newsRoutes"; // 뉴스 라우트 추가
import community from "./routes/community";

import redditRoutes from "./routes/redditRoutes";
import chatbotRoutes from "./routes/chatbotRoutes";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/assets", assetsRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/community", community);
app.use("/api/reddit", redditRoutes);
app.use("/api/chatbot", chatbotRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello from Express with WebSocket!");
});

const server = http.createServer(app);
const io = setupSocket(server);

// 에러 핸들링 미들웨어 (매개변수가 4개여야 합니다)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(err.statusCode ?? 500).json({ message: err.message ?? "서버 오류" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Polygon 스트림
  // startPolygonPriceStream(io).catch((err) => console.error("Failed to start Polygon stream:", err));

  // Binance 암호화폐 5초 주기 DB 업데이트
  // updateCryptoAssetInfoPeriodically();
  // setInterval(updateCryptoAssetInfoPeriodically, 5000);
});
