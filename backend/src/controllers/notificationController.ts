import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as notifService from "../services/notificationService";

export async function getDismissed(req: AuthRequest, res: Response) {
  const uuidHex = req.user!.uuid as string;
  const dismissed = await notifService.fetchDismissedNotifications(uuidHex);
  res.json({ dismissed });
}

export async function postDismiss(req: AuthRequest, res: Response) {
  const uuidHex = req.user!.uuid as string;
  const assetId = Number(req.body.assetId);
  const threshold = Number(req.body.threshold);
  await notifService.dismissNotification(uuidHex, assetId, threshold);
  res.status(201).end();
}
