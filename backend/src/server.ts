// /backend/src/server.ts
import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import { setupSocket } from "./socket";
import { startPolygonPriceStream } from "./services/polygonPriceStream";
import { updateCryptoAssetInfoPeriodically } from "./services/binanceService";

import authRoutes from "./routes/authRoutes";
import assetsRoutes from "./routes/assetsRoutes";
import newsRoutes from "./routes/newsRoutes";
import communityRoutes from "./routes/communityRoutes";
import redditRoutes from "./routes/redditRoutes";
import chatbotRoutes from "./routes/chatbotRoutes";
import userRoutes from "./routes/userRoutes";

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

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello from Express with WebSocket!");
});

const server = http.createServer(app);
const io = setupSocket(server);

// error-handler (must have 4 args)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(err.statusCode ?? 500).json({ message: err.message ?? "서버 오류" });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Polygon 스트림
  // startPolygonPriceStream(io).catch((err) => console.error("Failed to start Polygon stream:", err));

  // Binance 암호화폐 5초 주기 DB 업데이트
  updateCryptoAssetInfoPeriodically();
  setInterval(updateCryptoAssetInfoPeriodically, 5000);
});

