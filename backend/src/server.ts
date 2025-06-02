// /backend/src/server.ts
import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { setupSocket } from "./socket";

dotenv.config();

// 라우트 모듈 임포트
import authRoutes from "./routes/auth";

const app = express();

// CORS 설정 (예: 프론트엔드 오리진 지정)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

// 모든 API 요청은 '/api/' 앞에 붙습니다.
app.use("/api/auth", authRoutes);

const server = http.createServer(app);
setupSocket(server);

app.get("/", (req, res) => {
  res.send("Hello from Express with WebSocket!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
