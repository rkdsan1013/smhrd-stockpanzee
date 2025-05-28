// fetch_nasdaq_incremental.ts

import axios from "axios";
import fs from "fs/promises";
import path from "path";

// 설정

const API_KEY = "d0r5c6hr01qn4tjgisd0d0r5c6hr01qn4tjgisdg"; // ← 본인 키로 교체
const SYMBOLS_URL = "https://finnhub.io/api/v1/stock/symbol";
const PROCESSED_FILE = path.resolve(__dirname, "processed_symbols.json");
const REQUEST_DELAY_MS = 1100; // 초당 1회 이하 호출

// 타입 정의

interface SymbolEntry {
  symbol: string; // 티커
  description: string; // 회사명
  mic: string; // 거래소 MIC 코드 (XNAS, XNGS 등)
}

// 파일 입출력: 이미 처리된 심볼 목록

async function loadProcessed(): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(PROCESSED_FILE, "utf-8");
    return new Set<string>(JSON.parse(raw));
  } catch {
    return new Set<string>();
  }
}

async function saveProcessed(set: Set<string>): Promise<void> {
  await fs.writeFile(PROCESSED_FILE, JSON.stringify(Array.from(set), null, 2), "utf-8");
}

// 1) 전체 미국 상장 심볼 중 NASDAQ만 조회

async function fetchNasdaqSymbols(): Promise<SymbolEntry[]> {
  const res = await axios.get<SymbolEntry[]>(SYMBOLS_URL, {
    params: { exchange: "US", token: API_KEY },
    headers: { "X-Finnhub-Token": API_KEY },
  });
  // mic이 XNAS 또는 XNGS인 것만 필터
  return res.data.filter((e) => e.mic === "XNAS" || e.mic === "XNGS");
}

// 2) 처리 루프

async function main() {
  console.log("📥 NASDAQ 종목 전체 목록 요청 중...");
  const all = await fetchNasdaqSymbols();
  console.log(`✔️ 총 ${all.length}개 NASDAQ 심볼 수신됨`);

  const processed = await loadProcessed();
  console.log(`   └ 이미 처리된 심볼: ${processed.size}개`);

  // SymbolEntry 객체 그대로 남겨두기
  const newEntries = all.filter((e) => !processed.has(e.symbol));
  console.log(`▶️ 신규 심볼: ${newEntries.length}개`);

  for (const entry of newEntries) {
    // 무료 플랜 초당 1회 제한 대응
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));

    // 원하는 정보만 출력
    console.log(`✅ ${entry.symbol} — ${entry.description} | Market: NASDAQ`);

    // 처리 완료 표시
    processed.add(entry.symbol);
  }

  // 처리된 심볼 파일에 저장
  await saveProcessed(processed);
  console.log(`✅ 처리 완료. 총 처리된 심볼: ${processed.size}개 (저장됨)`);
}

main().catch((err) => {
  console.error("❌ 실행 중 오류:", err.message);
  process.exit(1);
});
