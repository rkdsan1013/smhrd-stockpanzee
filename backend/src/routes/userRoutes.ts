// /backend/src/routes/userRoutes.ts
import express from "express";
import { authenticate } from "../middlewares/auth";
import * as userController from "../controllers/userController";

const router = express.Router();
router.get("/me", authenticate, userController.getProfile);
export default router;
