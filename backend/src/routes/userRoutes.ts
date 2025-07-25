// /backend/src/routes/userRoutes.ts
import express from "express";
import { authenticate } from "../middlewares/auth";
import * as userController from "../controllers/userController";

const router = express.Router();

router.get("/me", authenticate, userController.getProfile);
router.put("/me", authenticate, userController.updateProfile);
router.delete("/me", authenticate, userController.deleteUser);

export default router;
