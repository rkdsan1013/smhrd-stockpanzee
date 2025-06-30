// /backend/src/routes/authRoutes.ts
import express from "express";
import * as authController from "../controllers/authController";
import { googleLogin } from "../controllers/googleAuthController";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/google", googleLogin);

export default router;
