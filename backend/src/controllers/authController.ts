// /backend/src/controllers/authController.ts
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { v4 as uuidv4, parse as uuidParse } from "uuid";
import { SignJWT } from "jose";
import { TextEncoder } from "util";
import * as authModel from "../models/authModel";

// JWT 서명을 위한 비밀 키 (환경변수에서 읽음)
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;

    // 중복 등록 검사
    const existingUsers = await authModel.findUserByEmail(email);
    if (existingUsers.length > 0) {
      res.status(400).json({ success: false, message: "이미 등록된 이메일입니다." });
      return;
    }

    // 비밀번호 해싱
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // UUID 생성 및 BINARY(16) 변환
    const userUuid = uuidv4();
    const userUuidBuffer = Buffer.from(uuidParse(userUuid));

    // DB에 사용자 등록 (users, user_profiles)
    await authModel.registerUser(userUuidBuffer, email, hashedPassword, username);

    // Jose를 사용해 JWT 토큰 생성 (payload에 uuid 포함)
    const token = await new SignJWT({ uuid: userUuid })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(jwtSecret);

    // HttpOnly 쿠키에 JWT 토큰 저장 (production에서는 secure 옵션 활성)
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

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const users = await authModel.findUserByEmail(email);
    if (users.length === 0) {
      res.status(400).json({ success: false, message: "가입된 사용자가 없습니다." });
      return;
    }
    const user = users[0];

    // 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: "비밀번호가 일치하지 않습니다." });
      return;
    }

    // DB의 BINARY uuid를 hex 문자열로 변환
    const userUuidStr = user.uuid.toString("hex");

    // JWT 토큰 생성
    const token = await new SignJWT({ uuid: userUuidStr })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(jwtSecret);

    // HttpOnly 쿠키에 토큰 저장
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
