import * as model from "../models/dismissedNotificationModel";

export async function fetchDismissedNotifications(userUuid: string): Promise<number[]> {
  return model.fetchDismissedNotificationsModel(userUuid);
}

export async function dismissNotification(userUuid: string, assetId: number): Promise<void> {
  await model.dismissNotificationModel(userUuid, assetId);
}
