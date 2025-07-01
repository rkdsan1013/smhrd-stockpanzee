// /backend/src/services/favoriteService.ts
import * as favoriteModel from "../models/favoriteModel";

export async function fetchFavorites(userUuidHex: string): Promise<number[]> {
  return favoriteModel.fetchFavoritesModel(userUuidHex);
}

export async function addFavorite(userUuidHex: string, assetId: number): Promise<void> {
  await favoriteModel.addFavoriteModel(userUuidHex, assetId);
}

export async function removeFavorite(userUuidHex: string, assetId: number): Promise<void> {
  await favoriteModel.removeFavoriteModel(userUuidHex, assetId);
}
