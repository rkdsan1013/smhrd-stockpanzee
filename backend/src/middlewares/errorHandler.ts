// /backend/src/middlewares/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);
  const status = err.statusCode || 500;
  const message = err.message || "서버 내부 오류";
  res.status(status).json({ success: false, message });
}
