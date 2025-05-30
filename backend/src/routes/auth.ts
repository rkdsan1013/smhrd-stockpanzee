// /backend/src/routes/auth.ts
import express, { Request, Response, NextFunction } from "express";
import pool from "../config/db";
import bcrypt from "bcrypt";
import { v4 as uuidv4, parse as uuidParse } from "uuid"; // cSpell:ignore uuidv4
import { SignJWT } from "jose";
import { TextEncoder } from "util";

const router = express.Router();

// JWT 서명을 위한 비밀 키 (TextEncoder를 사용하여 Uint8Array로 변환)
const jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");

router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;

    // 이메일 중복 검사
    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if ((existing as any[]).length > 0) {
      res.status(400).json({ success: false, message: "이미 등록된 이메일입니다." });
      return;
    }

    // 비밀번호 암호화
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // UUID 생성 및 BINARY(16) 변환
    const userUuid = uuidv4();
    const userUuidBuffer = Buffer.from(uuidParse(userUuid));

    // users 테이블에 저장 (email, 암호화된 비밀번호)
    await pool.query("INSERT INTO users (uuid, email, password) VALUES (?, ?, ?)", [
      userUuidBuffer,
      email,
      hashedPassword,
    ]);

    // user_profiles 테이블에 프로필 정보 저장 (username)
    await pool.query("INSERT INTO user_profiles (uuid, name) VALUES (?, ?)", [
      userUuidBuffer,
      username,
    ]);

    // Jose SignJWT 사용하여 JWT 토큰 생성 (payload에 문자열 uuid 포함)
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
      maxAge: 3600 * 1000, // 1시간
    });

    res.status(201).json({ success: true, message: "회원가입에 성공했습니다." });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // 사용자를 이메일로 조회
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if ((rows as any[]).length === 0) {
      res.status(400).json({ success: false, message: "가입된 사용자가 없습니다." });
      return;
    }
    const user = (rows as any[])[0];

    // bcrypt로 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ success: false, message: "비밀번호가 일치하지 않습니다." });
      return;
    }

    // DB의 uuid는 BINARY(16) 형태이므로 hex 문자열로 변환
    const userUuidStr = user.uuid.toString("hex");

    // JWT 토큰 생성 (payload에 사용자 uuid 포함)
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
});

export default router;
