import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import { setupSocket } from "./socket";

dotenv.config();

const app = express();
const server = http.createServer(app);
setupSocket(server);

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.get("/", (_, res) => {
  res.send("Stockpanzee Server Running");
});

server.listen(process.env.PORT, () => {
  console.log(`✅ Server running on port ${process.env.PORT}`);
});