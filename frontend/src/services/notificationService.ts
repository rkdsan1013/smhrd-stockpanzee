import { get, post } from "./apiClient";

// 이미 닫은 assetId 목록
export async function fetchDismissedNotifications(): Promise<number[]> {
  const { dismissed } = await get<{ dismissed: number[] }>("/notifications/dismissed");
  return dismissed;
}

// 닫기 요청
export async function dismissNotification(assetId: number): Promise<void> {
  await post<void>(`/notifications/dismiss/${assetId}`);
}
