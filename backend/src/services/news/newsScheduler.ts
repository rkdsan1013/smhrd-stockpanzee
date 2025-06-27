// /backend/src/services/news/newsScheduler.ts
import cron from "node-cron";

import { fetchAndProcessKrxNews } from "./krxNewsService";
import { fetchAndProcessUsStockNews } from "./usStockNewsService";
import { fetchAndProcessCryptoNews } from "./cryptoNewsService";

/**
 * 국내 뉴스: 10분마다
 * ────────────────
 * 매시 00,10,20,30,40,50분에 실행
 */
cron.schedule(
  "*/10 * * * *",
  () => {
    console.log("⏰ [스케줄] 국내 뉴스 수집 시작");
    fetchAndProcessKrxNews().catch((err) => console.error("❌ 국내 뉴스 스케줄 오류:", err));
  },
  { timezone: "Asia/Seoul" },
);

/**
 * 해외(US) 뉴스: 1시간마다
 * ────────────────
 * 매시 정각에 실행
 */
cron.schedule(
  "0 * * * *",
  () => {
    console.log("⏰ [스케줄] 해외(US) 뉴스 수집 시작");
    fetchAndProcessUsStockNews().catch((err) => console.error("❌ US 뉴스 스케줄 오류:", err));
  },
  { timezone: "Asia/Seoul" },
);

/**
 * 암호화폐 뉴스: 10분마다
 * ────────────────
 * 매시 00,10,20,30,40,50분에 실행
 */
cron.schedule(
  "*/10 * * * *",
  () => {
    console.log("⏰ [스케줄] 암호화폐 뉴스 수집 시작");
    fetchAndProcessCryptoNews().catch((err) => console.error("❌ 암호화폐 뉴스 스케줄 오류:", err));
  },
  { timezone: "Asia/Seoul" },
);

console.log("✅ 뉴스 수집 스케줄러 등록 완료");
