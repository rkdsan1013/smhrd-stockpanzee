// /backend/src/models/queries/favoriteQueries.ts
export const SELECT_FAVORITES_BY_USER = `
  SELECT asset_id
    FROM user_favorites
   WHERE user_uuid = ?
`;

export const INSERT_FAVORITE = `
  INSERT IGNORE INTO user_favorites (user_uuid, asset_id)
       VALUES (?, ?)
`;

export const DELETE_FAVORITE = `
  DELETE FROM user_favorites
   WHERE user_uuid = ?
     AND asset_id = ?
`;
