// /backend/src/controllers/userController.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
// userService에서 import
import { getProfileService, updateProfileService, deleteUserService } from "../services/userService";

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
    // currentPassword 추가!
    const { email, password, username, currentPassword } = req.body;
    const updated = await updateProfileService(req.user.uuid as string, {
      email,
      password,
      username,
      currentPassword,   // 여기 추가!!
    });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}


export async function deleteUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user?.uuid) {
      console.log("deleteUser 호출됨, uuid:", req.user?.uuid);
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    await deleteUserService(req.user.uuid as string);
    res.json({ success: true });
  } catch (err) {
    console.log("deleteUser 에러:", err); // 에러 내용 꼭 찍기!
    next(err);
  }
}
