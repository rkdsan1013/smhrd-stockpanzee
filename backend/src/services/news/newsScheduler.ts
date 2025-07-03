// /backend/src/services/news/newsScheduler.ts
import cron from "node-cron";
import { spawn } from "child_process";
import dotenv from "dotenv";

import { fetchAndProcessKrxNews } from "./krxNewsService";
import { fetchAndProcessUsStockNews } from "./usStockNewsService";
import { fetchAndProcessCryptoNews } from "./cryptoNewsService";

dotenv.config();

/**
 * 환경 변수 기반 벡터 백업 실행
 */
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
    console.error("❌ 백업 실패: 환경 변수를 확인하세요");
    return;
  }

  const tables = PG_VECTOR_TABLES.split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (tables.length === 0) {
    console.error("❌ PG_VECTOR_TABLES 값이 비어 있습니다.");
    return;
  }

  const dumpPath = "/backup/vectordata.dump";
  const dockerArgs = [
    "exec",
    "-i",
    "stockpanzee-db",
    "pg_dump",
    "-h",
    "localhost",
    "-U",
    PG_USER,
    "-Fc",
    "-Z",
    "9",
    "-f",
    dumpPath,
    ...tables.flatMap((t) => ["-t", t]),
    PG_NAME,
  ];

  console.log("🛠️ docker pg_dump 실행:", ["docker", ...dockerArgs].join(" "));
  const child = spawn("docker", dockerArgs, {
    env: { ...process.env, PGPASSWORD: PG_PASS },
    stdio: "inherit",
  });

  child.on("close", (code) => {
    if (code === 0) {
      console.log(`✅ 벡터 백업 완료: ${dumpPath}`);
    } else {
      console.error(`❌ pg_dump 종료 코드 ${code}`);
    }
  });
}

/**
 * 뉴스 수집 스케줄러 시작
 * - 매 정각: 국내·미국·암호화폐 뉴스 전량 수집 후 백업
 */
export function startNewsScheduler() {
  cron.schedule(
    "0 * * * *",
    async () => {
      console.log("⏰ 00분: 전체 뉴스 수집 시작");
      try {
        await Promise.all([
          fetchAndProcessKrxNews(),
          fetchAndProcessCryptoNews(),
          fetchAndProcessUsStockNews(),
        ]);
        backupVectorData();
      } catch (err) {
        console.error("❌ 뉴스 수집 오류:", err);
      }
    },
    { timezone: "Asia/Seoul" },
  );

  console.log("🔔 뉴스 스케줄러 등록 완료");
}
