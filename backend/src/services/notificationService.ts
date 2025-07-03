import * as model from "../models/dismissedNotificationModel";

export interface DismissedNotification {
  assetId: number;
  threshold: number;
}

export async function fetchDismissedNotifications(
  userUuid: string,
): Promise<DismissedNotification[]> {
  return model.fetchDismissedNotificationsModel(userUuid);
}

export async function dismissNotification(
  userUuid: string,
  assetId: number,
  threshold: number,
): Promise<void> {
  await model.dismissNotificationModel(userUuid, assetId, threshold);
}
