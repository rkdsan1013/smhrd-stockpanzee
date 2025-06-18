export const SELECT_ALL_ASSETS = `
  SELECT
    a.id,
    a.symbol,
    a.name,
    a.market,
    ai.current_price    AS current_price,
    ai.price_change     AS price_change,
    ai.market_cap       AS market_cap,
    a.created_at,
    a.updated_at
  FROM assets AS a
  LEFT JOIN asset_info AS ai
    ON ai.asset_id = a.id
  ORDER BY a.id;
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
  INSERT INTO asset_info (asset_id, current_price, price_change, market_cap, last_updated)
  VALUES (?, ?, ?, ?, NOW())
  ON DUPLICATE KEY UPDATE
    current_price = VALUES(current_price),
    price_change  = VALUES(price_change),
    market_cap    = VALUES(market_cap),
    last_updated  = NOW()
`;
