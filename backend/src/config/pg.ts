// /backend/src/config/pg.ts
import dotenv from "dotenv";
import { Pool } from "pg";
import * as pg from "pg";

dotenv.config();

const pool = new Pool({
  host: process.env.PG_HOST,
  port: Number(process.env.PG_PORT),
  user: process.env.PG_USER,
  password: process.env.PG_PASS,
  database: process.env.PG_NAME,
});

async function initializeTypeParsers(): Promise<void> {
  try {
    const client = await pool.connect();
    client.release();

    // BIGINT 등 커스텀 파서 등록
    pg.types.setTypeParser(20, (val: string) => parseInt(val, 10));
    console.log("Type parser for BIGINT (OID 20) registered successfully.");
  } catch (error) {
    console.error("Error setting type parsers:", error);
  }
}

initializeTypeParsers();

export default pool;
