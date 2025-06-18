// /backend/src/models/assetQueries.ts
export const SELECT_ALL_ASSETS = `
  SELECT id, symbol, name, market, created_at, updated_at
  FROM assets
  ORDER BY id
`;

export const INSERT_ASSET = `
  INSERT INTO assets (symbol, name, market)
  VALUES (?, ?, ?)
`;

export const UPSERT_ASSET = `
  INSERT INTO assets (symbol, name, market)
  VALUES (?, ?, ?)
  ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    market = VALUES(market)
`;

// Binance 시장에 한정하여 자산 목록을 조회하는 쿼리 추가
export const SELECT_CRYPTO_ASSETS = `
  SELECT id, symbol, name, market, created_at, updated_at
  FROM assets
  WHERE market = 'Binance'
  ORDER BY id
`;