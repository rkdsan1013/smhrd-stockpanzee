// /backend/src/routes/authRoutes.ts
import express from "express";
import * as authController from "../controllers/authController";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);

export default router;
