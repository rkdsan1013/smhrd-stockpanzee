// /backend/src/server.ts
import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";

import { setupSocket } from "./socket";
import { startPolygonPriceStream } from "./services/polygonPriceStream";

import authRoutes from "./routes/authRoutes";
import assetsRoutes from "./routes/assetsRoutes";
import newsRoutes from "./routes/newsRoutes";
import redditRoutes from "./routes/redditRoutes";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// 라우트 등록
app.use("/api/auth", authRoutes);
app.use("/api/assets", assetsRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/reddit", redditRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Express with WebSocket!");
});

const server = http.createServer(app);

// Socket.IO 셋업 — 반드시 반환 값을 받아둡니다.
const io = setupSocket(server);

// 에러 핸들링 미들웨어
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  const status = err.statusCode ?? 500;
  res.status(status).json({ message: err.message ?? "서버 오류" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Polygon 스트림에는 반드시 io 인스턴스를 넘겨주세요.
  startPolygonPriceStream(io).catch((err) => console.error("Failed to start Polygon stream:", err));
});
