// /backend/src/server.ts
import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { setupSocket } from "./socket";
import { startPolygonPriceStream } from "./services/polygonPriceStream"; // ✅ 추가

dotenv.config();

import authRoutes from "./routes/authRoutes";
import assetsRoutes from "./routes/assetsRoutes";
import newsRoutes from "./routes/newsRoutes"; // 뉴스 라우트 추가

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

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from Express with WebSocket!");
});

const server = http.createServer(app);
setupSocket(server);

// 에러 핸들링 미들웨어
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  const status = err.statusCode ?? 500;
  res.status(status).json({ message: err.message ?? "서버 오류" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startPolygonPriceStream(); // ✅ WebSocket 실행
});
