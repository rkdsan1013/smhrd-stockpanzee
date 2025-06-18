// /backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";

/**
 * 회원가입 요청 처리
 * - 서비스 계층을 통해 회원가입 로직 수행
 * - JWT 토큰을 HttpOnly 쿠키에 저장하여 응답
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;
    // 서비스 계층에서 회원가입 로직 실행
    const token = await authService.registerUserService(username, email, password);

    // JWT 토큰을 HttpOnly 쿠키에 저장 (production에서는 secure 옵션 활성)
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600 * 1000,
    });

    res.status(201).json({ success: true, message: "회원가입에 성공했습니다." });
  } catch (error) {
    next(error);
  }
};

/**
 * 로그인 요청 처리
 * - 서비스 계층을 통해 로그인 로직 수행
 * - JWT 토큰을 HttpOnly 쿠키에 저장하여 응답
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    // 서비스 계층에서 로그인 로직 실행
    const token = await authService.loginUserService(email, password);

    // JWT 토큰을 HttpOnly 쿠키에 저장
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600 * 1000,
    });

    res.status(200).json({ success: true, message: "로그인에 성공했습니다." });
  } catch (error) {
    next(error);
  }
};