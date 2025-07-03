import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import * as notifCtrl from "../controllers/notificationController";

const router = Router();
router.use(authenticate);

// 이미 해제된 (assetId, threshold) 조회
router.get("/notifications/dismissed", notifCtrl.getDismissed);

// 특정 단계 알림 해제
// POST body: { assetId: number, threshold: number }
router.post("/notifications/dismiss", notifCtrl.postDismiss);

export default router;
