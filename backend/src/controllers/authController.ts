// /backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";

/**
 * POST /auth/register
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password } = req.body;
    const token = await authService.registerUserService(username, email, password);
    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600 * 1000,
      })
      .status(201)
      .json({ success: true, message: "회원가입에 성공했습니다." });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/login
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const token = await authService.loginUserService(email, password);
    res
      .cookie("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600 * 1000,
      })
      .status(200)
      .json({ success: true, message: "로그인에 성공했습니다." });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /auth/logout
 */
export function logout(_req: Request, res: Response) {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ success: true, message: "로그아웃 되었습니다." });
}
