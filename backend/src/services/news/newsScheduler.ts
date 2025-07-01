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

  // 컨테이너 내부 경로
  const dumpPath = "/backup/vectordata.dump";

  // docker exec 로 DB 컨테이너 내부 pg_dump(v16) 호출
  const dockerArgs = [
    "exec",
    "-i",
    "stockpanzee-db",
    "pg_dump",
    "-h",
    "localhost", // 컨테이너 내부에서 localhost
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

// 00분: 전체 수집 + 백업
cron.schedule(
  "0 * * * *",
  async () => {
    console.log("⏰ 00분: 전체 뉴스 수집");
    try {
      await Promise.all([
        fetchAndProcessKrxNews(),
        fetchAndProcessCryptoNews(),
        fetchAndProcessUsStockNews(),
      ]);
      backupVectorData();
    } catch (err) {
      console.error("❌ 수집 오류:", err);
    }
  },
  { timezone: "Asia/Seoul" },
);

// 10,20,30,40,50분: 일부 수집 + 백업
// cron.schedule(
//   "10,20,30,40,50 * * * *",
//   async () => {
//     console.log("⏰ 10분 간격: 국내+암호화폐 수집");
//     try {
//       await Promise.all([fetchAndProcessKrxNews(), fetchAndProcessCryptoNews()]);
//       backupVectorData();
//     } catch (err) {
//       console.error("❌ 수집 오류:", err);
//     }
//   },
//   { timezone: "Asia/Seoul" },
// );

console.log("🔔 뉴스 스케줄러 및 벡터 백업 등록 완료");
