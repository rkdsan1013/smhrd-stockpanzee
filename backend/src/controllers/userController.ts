// /backend/src/controllers/userController.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as authService from "../services/authService";

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user?.uuid) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const profile = await authService.getProfileService(req.user.uuid as string);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}
