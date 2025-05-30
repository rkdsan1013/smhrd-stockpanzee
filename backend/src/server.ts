// /backend/src/server.ts
import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { setupSocket } from "./socket";
import pool from "./config/db";
import authRoutes from "./routes/auth";

dotenv.config();

const app = express();

// CORS 설정: 클라이언트 오리진 명시 및 credentials 허용
app.use(
  cors({
    origin: "http://localhost:5173", // 클라이언트 오리진
    credentials: true, // 쿠키 등 자격 증명 정보를 허용
  }),
);

app.use(express.json());
app.use("/auth", authRoutes);

const server = http.createServer(app);
setupSocket(server);

app.get("/", (req, res) => {
  res.send("Hello from Express with WebSocket!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
