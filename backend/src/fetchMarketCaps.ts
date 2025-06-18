// src/fetchMarketCaps.ts
import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import mysql from "mysql2/promise";
import { RowDataPacket } from "mysql2/promise";

const { FMP_API_KEY, DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

if (!FMP_API_KEY || !DB_HOST || !DB_PORT || !DB_USER || !DB_PASS || !DB_NAME) {
  console.error(
    "❌ .env에 모든 설정(FMP_API_KEY, DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME)을 확인하세요.",
  );
  process.exit(1);
}

const pool = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000,
  timezone: "+09:00",
});

// 배열을 일정 크기로 분할하는 헬퍼
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function fetchMarketCaps() {
  const conn = await pool.getConnection();
  try {
    // 1) DB에 저장된 id, symbol 불러오기
    const [rows] = await conn.execute<({ id: number; symbol: string } & RowDataPacket)[]>(
      "SELECT id, symbol FROM assets",
    );
    const assetMap = new Map<string, number>(rows.map((r) => [r.symbol, r.id]));
    const symbols = Array.from(assetMap.keys());

    // 2) Batch Market Cap API: 1,000개씩 묶어서 호출 (최소 호출 횟수)
    const CHUNK_SIZE = 1000;
    const chunks = chunkArray(symbols, CHUNK_SIZE);

    let totalUpdated = 0;

    for (const chunk of chunks) {
      const url =
        `https://financialmodelingprep.com/api/v3/market-capitalization-batch` +
        `?symbols=${chunk.join(",")}&apikey=${FMP_API_KEY}`;
      const { data } = await axios.get<{ symbol: string; marketCap: number }[]>(url); // :contentReference[oaicite:0]{index=0}

      // 3) 유효한 데이터만 필터링
      const values = data
        .filter((item) => assetMap.has(item.symbol) && item.marketCap > 0)
        .map((item) => `(${assetMap.get(item.symbol)}, ${item.marketCap})`)
        .join(",");

      if (values) {
        // 4) 한 번의 쿼리로 INSERT ... ON DUPLICATE KEY UPDATE
        const sql = `
          INSERT INTO asset_info (asset_id, market_cap)
          VALUES ${values}
          ON DUPLICATE KEY UPDATE
            market_cap = VALUES(market_cap)
        `;
        const [result] = await conn.query(sql);
        // @ts-ignore
        totalUpdated += (result as any).affectedRows;
      }
    }

    console.log(`🎉 총 ${chunks.length}회 호출, ${totalUpdated}건 시가총액 저장/업데이트 완료`);
  } catch (err) {
    console.error("❌ fetchMarketCaps 오류:", err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

fetchMarketCaps();
