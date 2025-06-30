// /backend/src/services/news/newsScheduler.ts
import cron from "node-cron";
import { spawn } from "child_process";
import dotenv from "dotenv";

import { fetchAndProcessKrxNews } from "./krxNewsService";
import { fetchAndProcessUsStockNews } from "./usStockNewsService";
import { fetchAndProcessCryptoNews } from "./cryptoNewsService";

dotenv.config();

function backupVectorData() {
  const {
    PG_HOST = "db",
    PG_PORT = "5432",
    PG_USER,
    PG_PASS,
    PG_NAME,
    PG_VECTOR_TABLES,
  } = process.env;

  if (!PG_USER || !PG_PASS || !PG_NAME || !PG_VECTOR_TABLES) {
    console.error(
      "❌ 벡터 데이터 백업 실패: PG_USER, PG_PASS, PG_NAME, PG_VECTOR_TABLES 확인 필요",
    );
    return;
  }

  const tables = PG_VECTOR_TABLES.split(",").map((t) => t.trim());
  if (tables.length === 0) {
    console.error("❌ PG_VECTOR_TABLES에 백업할 테이블을 지정하세요.");
    return;
  }

  const dumpPath = "/backup/vectordata.dump";
  const args = [
    "-h",
    PG_HOST,
    "-p",
    PG_PORT,
    "-U",
    PG_USER,
    "-Fc", // custom-format
    "-Z",
    "9", // optional: 최대 압축
    "-f",
    dumpPath, // stdout 대신 파일 직접 쓰기
    ...tables.flatMap((t) => ["-t", t]),
    PG_NAME,
  ];

  const env = { ...process.env, PGPASSWORD: PG_PASS };

  console.log("🛠️  pg_dump 실행:", ["pg_dump", ...args].join(" "));
  const child = spawn("pg_dump", args, { env, stdio: "inherit" });

  child.on("close", (code) => {
    if (code === 0) {
      console.log(`✅ 벡터 데이터 백업 완료: ${dumpPath}`);
    } else {
      console.error(`❌ pg_dump 비정상 종료 코드: ${code}`);
    }
  });
}

// 00분: 전 뉴스 수집 → 벡터 백업
cron.schedule(
  "0 * * * *",
  async () => {
    console.log("⏰ [스케줄] 00분: 전체 뉴스 수집 시작");
    try {
      await Promise.all([
        fetchAndProcessKrxNews(),
        fetchAndProcessCryptoNews(),
        fetchAndProcessUsStockNews(),
      ]);
      console.log("✅ 전체 뉴스 수집 완료 → 벡터 데이터 백업 실행");
      backupVectorData();
    } catch (err) {
      console.error("❌ 전체 뉴스 수집 오류:", err);
    }
  },
  { timezone: "Asia/Seoul" },
);

// 10,20,30,40,50분: 국내+암호화폐 수집 → 벡터 백업
cron.schedule(
  "10,20,30,40,50 * * * *",
  async () => {
    console.log("⏰ [스케줄] 10분 단위: 국내+암호화폐 수집 시작");
    try {
      await Promise.all([fetchAndProcessKrxNews(), fetchAndProcessCryptoNews()]);
      console.log("✅ 국내+암호화폐 수집 완료 → 벡터 데이터 백업 실행");
      backupVectorData();
    } catch (err) {
      console.error("❌ 국내+암호화폐 수집 오류:", err);
    }
  },
  { timezone: "Asia/Seoul" },
);

console.log("🔔 뉴스 수집 스케줄러 & 벡터 데이터 백업 등록 완료");
