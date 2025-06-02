// /backend/src/server.ts
import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { setupSocket } from "./socket"; // WebSocket 관련 설정 (구현되어 있다 가정)
import authRoutes from "./routes/auth";

dotenv.config();

const app = express();

// CORS 설정 (예: 프론트엔드 오리진을 지정)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
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
