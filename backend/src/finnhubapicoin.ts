import axios from "axios";
import fs from "fs/promises";
import path from "path";

// 설정
const COINGECKO_URL = "https://api.coingecko.com/api/v3/coins/markets";
const PROCESSED_FILE = path.resolve(__dirname, "processed_crypto_symbols.json");
const REQUEST_DELAY_MS = 1100; // CoinGecko 무료 플랜 초당 10~50 호출 제한
const MAX_RETRIES = 3; // 최대 재시도 횟수
const TIMEOUT_MS = 10000; // 요청 타임아웃 10초

// 타입 정의
interface CryptoSymbolEntry {
  id: string;
  symbol: string;
  name: string;
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

// 1) 바이낸스에 상장된 코인 심볼 조회 (USD 기준)
async function fetchCryptoSymbols(): Promise<CryptoSymbolEntry[]> {
  const allSymbols: CryptoSymbolEntry[] = [];
  let page = 1;
  const perPage = 250; // CoinGecko 최대 페이지당 250개

  while (true) {
    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        const res = await axios.get<CryptoSymbolEntry[]>(COINGECKO_URL, {
          params: {
            vs_currency: "usd", // USD 기준
            exchange_ids: "binance", // 바이낸스 거래소
            per_page: perPage,
            page: page,
            sparkline: false, // 불필요한 데이터 제외
            order: "market_cap_desc", // 시가총액 순 정렬
          },
          timeout: TIMEOUT_MS,
        });

        if (res.data.length === 0) {
          console.log(`✔️ 페이지 ${page}에 더 이상 데이터 없음`);
          return allSymbols;
        }

        allSymbols.push(
          ...res.data.map((coin) => ({
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
          })),
        );

        console.log(`✔️ 페이지 ${page} 수신됨: ${res.data.length}개 심볼`);
        page++;
        await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
        break; // 성공 시 재시도 루프 종료
      } catch (error: unknown) {
        retries++;
        let message = "Unknown error";
        let status: number | undefined;
        if (error instanceof Error) {
          message = error.message;
          if ("response" in error && error.response && typeof error.response === "object") {
            status = (error.response as any).status;
            message = (error.response as any).data?.message || message;
          }
        }
        if (retries === MAX_RETRIES) {
          console.error(
            `❌ 페이지 ${page} 요청 실패 (재시도 ${retries}/${MAX_RETRIES}): ${status || "Unknown"} - ${message}`,
          );
          return allSymbols; // 최대 재시도 후 종료
        }
        console.warn(
          `⚠️ 페이지 ${page} 요청 오류, 재시도 ${retries}/${MAX_RETRIES}: ${status || "Unknown"} - ${message}`,
        );
        await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS * retries));
      }
    }
  }
}

// 2) 처리 루프
async function main() {
  console.log("📥 CoinGecko 바이낸스 상장 코인 심볼 목록 요청 중...");
  const all = await fetchCryptoSymbols();
  console.log(`✔️ 총 ${all.length}개 바이낸스 상장 코인 심볼 수신됨`);

  const processed = await loadProcessed();
  console.log(`   └ 이미 처리된 심볼: ${processed.size}개`);

  // 신규 심볼 필터링
  const newEntries = all.filter((e) => !processed.has(e.symbol));
  console.log(`▶️ 신규 심볼: ${newEntries.length}개`);

  for (const entry of newEntries) {
    await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    console.log(`✅ ${entry.symbol.toUpperCase()} | ${entry.name} | Market: Binance`);
    processed.add(entry.symbol);
  }

  await saveProcessed(processed);
  console.log(`✅ 처리 완료. 총 처리된 심볼: ${processed.size}개 (저장됨)`);
}

main().catch((error: Error) => {
  console.error("❌ 실행 중 오류:", error.message);
  process.exit(1);
});
