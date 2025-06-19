// /backend/src/middlewares/authenticate.ts
import { Request, Response, NextFunction } from "express";
import { jwtVerify } from "jose";

const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");

// req.user 타입 확장 (선택, 타입스크립트용)
declare module "express-serve-static-core" {
  interface Request {
    user?: { uuid: string };
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  const token = typeof authHeader === "string" && authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "토큰이 필요합니다." });
  }

  try {
    // jose 라이브러리 사용
    const { payload } = await jwtVerify(token, jwtSecret);
    // payload에 uuid가 있어야 함
    if (!payload || typeof payload.uuid !== "string") {
      return res.status(401).json({ message: "토큰이 유효하지 않습니다." });
    }
    // req.user로 저장해두기
    req.user = { uuid: payload.uuid };
    next();
  } catch (err) {
    return res.status(401).json({ message: "토큰 인증 실패" });
  }
}
