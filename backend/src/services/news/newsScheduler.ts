// /backend/src/services/news/newsScheduler.ts
import cron from "node-cron";
import { spawn } from "child_process";
import fs from "fs";
import dotenv from "dotenv";

import { fetchAndProcessKrxNews } from "./krxNewsService";
import { fetchAndProcessUsStockNews } from "./usStockNewsService";
import { fetchAndProcessCryptoNews } from "./cryptoNewsService";

dotenv.config();

/**
 * 벡터 전용 덤프
 *  • PG_VECTOR_TABLES=table1,table2 식으로 .env에 설정
 *  • /backup/vectordata.dump 에 압축 포맷 덤프 (기존 덮어쓰기)
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
    console.error(
      "❌ 벡터 데이터 백업 실패: PG_USER, PG_PASS, PG_NAME, PG_VECTOR_TABLES 확인 필요",
    );
    return;
  }

  // 테이블 이름 배열화
  const tables = PG_VECTOR_TABLES.split(",").map((t) => t.trim());
  if (tables.length === 0) {
    console.error("❌ PG_VECTOR_TABLES에 백업할 테이블을 지정하세요.");
    return;
  }

  // pg_dump 인자 구성
  const args = ["-h", PG_HOST, "-p", PG_PORT, "-U", PG_USER];
  tables.forEach((tbl) => {
    args.push("-t", tbl);
  });
  args.push("-Fc", PG_NAME);

  const dumpPath = "/backup/vectordata.dump";
  const env = { ...process.env, PGPASSWORD: PG_PASS };

  console.log("🛠️  pg_dump (벡터) 실행:", ["pg_dump", ...args].join(" "));
  const child = spawn("pg_dump", args, { env });

  // stdout → 덤프 파일
  const outStream = fs.createWriteStream(dumpPath);
  child.stdout.pipe(outStream);

  // stderr & lifecycle 로깅
  child.stderr.on("data", (buf) => console.error("❌ pg_dump stderr:", buf.toString()));
  child.on("error", (err) => console.error("❌ pg_dump 실행 오류:", err));
  child.on("close", (code) => {
    if (code === 0) {
      console.log(`✅ 벡터 데이터 백업 완료: ${dumpPath}`);
    } else {
      console.error(`❌ 벡터 데이터 백업 비정상 종료 코드: ${code}`);
    }
  });
}

// ─────────────────────────────────────────────
// 00분 스케줄: 국내 + 암호화폐 + US 수집 → 벡터 백업
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

// ─────────────────────────────────────────────
// 10,20,30,40,50분 스케줄: 국내 + 암호화폐 수집 → 벡터 백업
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
