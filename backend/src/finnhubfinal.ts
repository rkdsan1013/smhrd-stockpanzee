import axios from "axios";
import fs from "fs/promises";
import path from "path";

// 설정
const API_KEY = "d0r5c6hr01qn4tjgisd0d0r5c6hr01qn4tjgisdg"; // 본인 키 사용
const SYMBOLS_URL = "https://finnhub.io/api/v1/stock/symbol";
const OUTPUT_FILE = path.resolve(__dirname, "nasdaq_listed_companies.json");

// 타입
interface SymbolEntry {
  symbol: string;
  description: string;
  mic: string;
}

async function fetchAllNasdaqAndSave(): Promise<void> {
  console.log("📡 NASDAQ 전체 심볼 요청 중...");

  const res = await axios.get<SymbolEntry[]>(SYMBOLS_URL, {
    params: { exchange: "US", token: API_KEY },
    headers: { "X-Finnhub-Token": API_KEY },
  });

  // mic이 XNAS 또는 XNGS인 항목만 필터링
  const nasdaqEntries = res.data.filter((e) => e.mic === "XNAS" || e.mic === "XNGS");

  console.log(`✔️ NASDAQ 종목 수: ${nasdaqEntries.length}개`);

  // 지정된 형식으로 가공
  const formatted = nasdaqEntries.map((entry) => ({
    name: entry.description,
    symbol: entry.symbol,
    market: "NASDAQ",
  }));

  // 파일 저장
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(formatted, null, 2), "utf-8");

  console.log(`✅ 파일 저장 완료: ${OUTPUT_FILE}`);
}

fetchAllNasdaqAndSave().catch((err) => {
  console.error("❌ 실행 중 오류:", err.message);
  process.exit(1);
});
