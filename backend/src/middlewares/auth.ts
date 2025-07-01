// /backend/src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import type { JWTPayload } from "jose";
import { verifyJwt } from "../utils/jwt";

export interface AuthRequest extends Request {
  cookies: Record<string, string>;
  headers: Record<string, any>;
  user?: JWTPayload;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token =
      req.cookies.access_token ||
      (typeof req.headers.authorization === "string" &&
      req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      res.status(401).json({ message: "토큰이 없습니다." });
      return;
    }

    const payload = await verifyJwt(token);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
}
