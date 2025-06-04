// /backend/src/server.ts
import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { setupSocket } from "./socket";
import assetsRouter from "./routes/assetsRoute";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", assetsRouter);

const server = http.createServer(app);
setupSocket(server);

app.get("/", (req, res) => {
  res.send("Hello from Express with WebSocket!");
});

// 서버 실행
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
