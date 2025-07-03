import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import * as notifCtrl from "../controllers/notificationController";

const router = Router();
// 인증된 사용자만 접근
router.use(authenticate);

// 이미 해제한 알림 목록 조회
router.get("/notifications/dismissed", notifCtrl.getDismissed);
// 특정 자산 알림 해제
router.post("/notifications/dismiss/:assetId", notifCtrl.postDismiss);

export default router;
