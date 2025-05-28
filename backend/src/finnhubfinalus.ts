import axios from "axios";
import fs from "fs/promises";
import path from "path";

// 설정
const API_KEY = "d0r5c6hr01qn4tjgisd0d0r5c6hr01qn4tjgisdg"; // ← 본인 API 키 입력
const SYMBOLS_URL = "https://finnhub.io/api/v1/stock/symbol";
const OUTPUT_FILE = path.resolve(__dirname, "us_listed_companies.json");

// 타입 정의
interface SymbolEntry {
  symbol: string;
  description: string;
  mic: string; // 거래소 MIC (e.g. XNAS, XNGS, XNYS)
}

// mic → Market 이름 변환용 맵
const MIC_TO_MARKET: Record<string, string> = {
  XNAS: "NASDAQ",
  XNGS: "NASDAQ",
  XNYS: "NYSE",
};

async function fetchUSListedCompanies(): Promise<void> {
  console.log("📡 미국 상장 종목 전체 요청 중...");

  const res = await axios.get<SymbolEntry[]>(SYMBOLS_URL, {
    params: { exchange: "US", token: API_KEY },
    headers: { "X-Finnhub-Token": API_KEY },
  });

  // NASDAQ과 NYSE 종목만 필터링
  const validEntries = res.data.filter((entry) => MIC_TO_MARKET[entry.mic]);

  console.log(`✔️ NASDAQ/NYSE 상장 종목 수: ${validEntries.length}개`);

  // name, symbol, market 형식으로 가공
  const formatted = validEntries.map((entry) => ({
    symbol: entry.symbol,
    name: entry.description,
    market: MIC_TO_MARKET[entry.mic],
  }));

  // 파일 저장
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(formatted, null, 2), "utf-8");
  console.log(`✅ 결과 저장 완료: ${OUTPUT_FILE}`);
}

fetchUSListedCompanies().catch((err) => {
  console.error("❌ 오류 발생:", err.message);
  process.exit(1);
});
