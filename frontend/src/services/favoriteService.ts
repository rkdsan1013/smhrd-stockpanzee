// /frontend/src/services/favoriteService.ts
import { get, post, remove } from "./apiClient";

// 서버에서 현재 사용자의 즐겨찾기 목록을 가져옵니다.
export async function fetchFavorites(): Promise<number[]> {
  // { favorites: number[] } 형태의 응답을 기대
  const data = await get<{ favorites: number[] }>("/favorites");
  return data.favorites;
}

// 특정 자산을 즐겨찾기에 추가합니다.
export async function addFavorite(assetId: number): Promise<void> {
  await post<void>(`/favorites/${assetId}`);
}

// 특정 자산을 즐겨찾기에서 제거합니다.
export async function removeFavorite(assetId: number): Promise<void> {
  await remove<void>(`/favorites/${assetId}`);
}
