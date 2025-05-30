// /backend/src/routes/auth.ts
import express from "express";
import * as authController from "../controllers/authController";

const router = express.Router();

// 회원가입 및 로그인 엔드포인트를 정의합니다.
router.post("/register", authController.register);
router.post("/login", authController.login);

export default router;
