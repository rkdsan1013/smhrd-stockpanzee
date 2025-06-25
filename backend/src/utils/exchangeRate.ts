// /backend/src/utils/exchangeRate.ts
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.EXCHANGE_API_KEY;
if (!API_KEY) {
  throw new Error("EXCHANGE_API_KEY가 .env에 설정되어 있지 않습니다.");
}

interface ExchangeRateResponse {
  result: string;
  base_code: string;
  conversion_rates: Record<string, number>;
}

const cache: Record<string, number> = {};
const cacheTimestamps: Record<string, number> = {};
const TTL = 60 * 60 * 1000; // 1시간 캐시

export async function getExchangeRate(from: string, to: string): Promise<number> {
  const cacheKey = `${from}_${to}`;
  const now = Date.now();

  // 캐시 유효 기간 체크
  if (cache[cacheKey] && now - cacheTimestamps[cacheKey] < TTL) {
    return cache[cacheKey];
  }

  try {
    // API 요청 URL (권장)
    const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${from}`;
    const { data } = await axios.get<ExchangeRateResponse>(url);

    if (data.result !== "success") {
      throw new Error("API 요청 실패");
    }

    const rate = data.conversion_rates[to];
    if (!rate) {
      throw new Error(`환율 데이터에 ${to} 정보 없음`);
    }

    // 캐시에 저장
    cache[cacheKey] = rate;
    cacheTimestamps[cacheKey] = now;

    console.log(`[환율] 최신 환율 적용: 1 ${from} = ${rate} ${to}`);
    return rate;
  } catch (err: any) {
    console.warn(`[환율] ${from} → ${to} API 호출 실패, 기본값 사용:`, err.message || err);
    // 기본값은 KRW 기준 1400 설정, 필요하면 변경 가능
    return 1400;
  }
}
