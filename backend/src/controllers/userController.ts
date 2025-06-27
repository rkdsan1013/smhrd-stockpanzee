// /backend/src/controllers/userController.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
// userService에서 import
import { getProfileService, updateProfileService } from "../services/userService";

export async function getProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user?.uuid) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const profile = await getProfileService(req.user.uuid as string);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user?.uuid) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    const { email, password, username } = req.body;
    const updated = await updateProfileService(req.user.uuid as string, {
      email,
      password,
      username,
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
