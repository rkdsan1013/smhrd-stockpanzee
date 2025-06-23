// /backend/src/config/pg.ts
import { Pool } from "pg";
import * as pg from "pg"; // pg.types 포함

const pool = new Pool({
  user: process.env.PGUSER || "stock",
  host: process.env.PGHOST || "db",
  database: process.env.PGDATABASE || "stockdb",
  password: process.env.PGPASSWORD || "stockpw",
  port: Number(process.env.PGPORT) || 5432,
});

async function initializeTypeParsers(): Promise<void> {
  try {
    const client = await pool.connect();
    client.release();

    if (typeof pg.types !== "undefined") {
      // 예시: BIGINT (OID 20) 값 파싱
      pg.types.setTypeParser(20, (val: string): number => parseInt(val, 10));
      console.log("Type parser for BIGINT (OID 20) registered successfully.");
    } else {
      console.error("pg.types is undefined. Check module initialization.");
    }
  } catch (error) {
    console.error("Error setting type parsers:", error);
  }
}

initializeTypeParsers();

export default pool;
