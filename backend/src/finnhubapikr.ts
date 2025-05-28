// fetch_korea_incremental.ts

import axios from "axios";
import fs from "fs/promises";
import path from "path";

////////////////////////////////////////////////////////////////////////////////
// 설정
////////////////////////////////////////////////////////////////////////////////

const API_KEY = "d0r5c6hr01qn4tjgisd0d0r5c6hr01qn4tjgisdg"; // ← 본인 키로 교체
const SYMBOLS_URL = "https://finnhub.io/api/v1/stock/symbol";
const PROCESSED_FILE = path.resolve(__dirname, "processed_korea_symbols.json");
const REQUEST_DELAY_MS = 1100; // 무료 플랜 초당 1회 이하 호출

////////////////////////////////////////////////////////////////////////////////
// 타입 정의
////////////////////////////////////////////////////////////////////////////////

interface SymbolEntry {
  symbol: string; // 티커
  description: string; // 회사명
  mic: string; // 거래소 MIC 코드 (XKRX, XKOS 등)
}

////////////////////////////////////////////////////////////////////////////////
// 파일 입출력: 이미 처리된 심볼 목록 로드/저장
////////////////////////////////////////////////////////////////////////////////

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

////////////////////////////////////////////////////////////////////////////////
// 1) 전체 한국거래소(KRX) 상장 종목 조회
////////////////////////////////////////////////////////////////////////////////

async function fetchKoreaSymbols(): Promise<SymbolEntry[]> {
  const res = await axios.get<SymbolEntry[]>(SYMBOLS_URL, {
    params: { exchange: "KRX", token: API_KEY },
    headers: { "X-Finnhub-Token": API_KEY },
  });
  // mic이 XKOS (KOSDAQ) 또는 XKRX (KRX)인 것만 필터
  return res.data.filter((e) => e.mic === "XKOS" || e.mic === "XKRX");
}

////////////////////////////////////////////////////////////////////////////////
// 2) 처리 루프
////////////////////////////////////////////////////////////////////////////////

async function main() {
  console.log("📥 한국 거래소 종목 전체 목록 요청 중...");
  const all = await fetchKoreaSymbols();
  console.log(`✔️ 총 ${all.length}개 종목 수신됨`);

  const processed = await loadProcessed();
  console.log(`   └ 이미 처리된 심볼: ${processed.size}개`);

  const newEntries = all.filter((e) => !processed.has(e.symbol));
  console.log(`▶️ 신규 심볼: ${newEntries.length}개`);

  for (const entry of newEntries) {
    // 무료 플랜 초당 1회 제한 대응
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));

    // 시장명 결정
    const marketName = entry.mic === "XKOS" ? "KOSDAQ" : "KRX";
    console.log(`✅ ${entry.symbol} — ${entry.description} | Market: ${marketName}`);

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
