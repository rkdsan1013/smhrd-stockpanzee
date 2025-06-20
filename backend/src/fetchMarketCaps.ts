// src/fetchMarketCaps.ts
import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import mysql from "mysql2/promise";
import { RowDataPacket } from "mysql2/promise";

const { FMP_API_KEY, DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

// 1) 필수 환경변수 확인
if (!FMP_API_KEY || !DB_HOST || !DB_PORT || !DB_USER || !DB_PASS || !DB_NAME) {
  console.error(
    "❌ .env에 FMP_API_KEY, DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME가 모두 설정되어 있는지 확인하세요.",
  );
  process.exit(1);
}

// 2) MySQL 연결 풀 생성
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

/**
 * 배열을 지정한 크기만큼 분할
 */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

interface QuoteItem {
  symbol: string;
  marketCap: number;
}

async function fetchMarketCaps() {
  const conn = await pool.getConnection();
  let totalUpdated = 0;

  try {
    // 3) assets 테이블에서 NYSE, NASDAQ 상장 심볼만 조회
    const [rows] = await conn.execute<({ id: number; symbol: string } & RowDataPacket)[]>(
      `SELECT id, symbol
       FROM assets
       WHERE market IN ('NYSE','NASDAQ')`,
    );

    // symbol 을 대문자로 매핑하여 assetMap 생성
    const assetMap = new Map<string, number>();
    rows.forEach((r) => assetMap.set(r.symbol.toUpperCase(), r.id));
    const symbols = Array.from(assetMap.keys());

    // 4) 1,000개씩 분할 → 약 7회 호출
    const CHUNK_SIZE = 1000;
    const chunks = chunkArray(symbols, CHUNK_SIZE);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      // Batch Quote API (최대 1,000개) 호출
      const url = `https://financialmodelingprep.com/api/v3/quote/${chunk.join(
        ",",
      )}?apikey=${FMP_API_KEY}`;

      let data: QuoteItem[] = [];
      try {
        const resp = await axios.get<QuoteItem[]>(url);
        data = resp.data;
      } catch (e: any) {
        console.warn(`⚠️ ${i + 1}/${chunks.length}차 배치 호출 실패:`, e.message || e);
        // 다음 배치로 계속 진행
        continue;
      }

      console.log(`\n===== ${i + 1}/${chunks.length}차 배치 처리 =====`);
      console.log(`요청 심볼 개수: ${chunk.length}, 반환 항목: ${data.length}`);

      // 5) DB 업서트용 VALUES 문자열 생성
      const values = data
        .filter((item) => {
          const sym = item.symbol.toUpperCase();
          return assetMap.has(sym) && item.marketCap > 0;
        })
        .map((item) => {
          const id = assetMap.get(item.symbol.toUpperCase())!;
          return `(${id}, ${item.marketCap})`;
        })
        .join(",");

      if (values) {
        const sql = `
          INSERT INTO asset_info (asset_id, market_cap)
          VALUES ${values}
          ON DUPLICATE KEY UPDATE
            market_cap = VALUES(market_cap)
        `;
        const [result] = await conn.query(sql);
        // @ts-ignore
        const count = (result as any).affectedRows || 0;
        totalUpdated += count;
        console.log(`✅ 업서트 완료: ${count}건`);
      } else {
        console.log("⚠️ 업서트할 데이터가 없습니다.");
      }
    }

    console.log(`\n🎉 전체 완료: ${chunks.length}회 호출, 총 ${totalUpdated}건 업서트`);
    process.exit(0);
  } catch (err: any) {
    console.error("❌ 전체 스크립트 오류:", err.message || err);
    process.exit(1);
  } finally {
    conn.release();
  }
}

fetchMarketCaps();
