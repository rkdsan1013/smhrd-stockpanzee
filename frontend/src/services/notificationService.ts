import { get, post } from "./apiClient";

export interface DismissedNotification {
  assetId: number;
  threshold: number;
}

export async function fetchDismissedNotifications(): Promise<DismissedNotification[]> {
  const { dismissed } = await get<{ dismissed: DismissedNotification[] }>(
    "/notifications/dismissed",
  );
  return dismissed;
}

export async function dismissNotification(assetId: number, threshold: number): Promise<void> {
  await post<void>("/notifications/dismiss", { assetId, threshold });
}
