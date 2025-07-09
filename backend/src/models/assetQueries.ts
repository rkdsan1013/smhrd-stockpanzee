// /backend/src/models/assetQueries.ts

export const SELECT_ALL_ASSETS = `
  SELECT
    a.id,
    a.symbol,
    a.name,
    a.market,
    ai.current_price AS current_price,
    ai.price_change AS price_change,
    ai.market_cap AS market_cap,
    a.created_at,
    a.updated_at
  FROM assets a
  LEFT JOIN asset_info ai ON ai.asset_id = a.id
  ORDER BY a.id;
`;

// 새로 추가: 가격 정보만 조회
export const SELECT_ASSET_PRICES = `
  SELECT
    asset_id    AS id,
    current_price AS current_price,
    price_change  AS price_change
  FROM asset_info;
`;

export const INSERT_ASSET = `
  INSERT INTO assets (symbol, name, market)
  VALUES (?, ?, ?)
`;

export const UPSERT_ASSET = `
  INSERT INTO assets (symbol, name, market)
  VALUES (?, ?, ?)
  ON DUPLICATE KEY UPDATE
    name   = VALUES(name),
    market = VALUES(market)
`;

export const UPSERT_ASSET_INFO = `
  INSERT INTO asset_info
    (asset_id, current_price, price_change, market_cap, last_updated)
  VALUES (?, ?, ?, ?, NOW())
  ON DUPLICATE KEY UPDATE
    current_price = VALUES(current_price),
    price_change  = VALUES(price_change),
    market_cap    = VALUES(market_cap),
    last_updated  = NOW()
`;

export const GET_ASSET_BY_SYMBOL_AND_MARKET = `
  SELECT
    a.id,
    a.symbol,
    a.name,
    a.market,
    ai.market_cap
  FROM assets a
  LEFT JOIN asset_info ai ON ai.asset_id = a.id
  WHERE a.symbol = ? AND a.market = ?;
`;

export const UPSERT_CRYPTO_INFO = `
  INSERT INTO asset_info
    (asset_id, current_price, price_change, market_cap, last_updated)
  VALUES (?, ?, ?, ?, NOW())
  ON DUPLICATE KEY UPDATE
    current_price = VALUES(current_price),
    price_change  = VALUES(price_change),
    market_cap    = VALUES(market_cap),
    last_updated  = NOW()
`;

export const SELECT_CRYPTO_ASSETS = `
  SELECT
    id,
    symbol,
    LOWER(name) AS coin_id
  FROM assets
  WHERE market = 'Binance'
  ORDER BY id;
`;

export const SELECT_STOCK_ASSETS = `
  SELECT
    a.id,
    a.symbol,
    a.name,
    a.market,
    ai.current_price AS current_price,
    ai.price_change  AS price_change,
    ai.market_cap    AS market_cap,
    a.created_at,
    a.updated_at
  FROM assets a
  LEFT JOIN asset_info ai ON ai.asset_id = a.id
  WHERE a.market IN ('NYSE','NASDAQ')
  ORDER BY a.id;
`;
