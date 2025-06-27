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
const TTL = 60 * 60 * 1000; // 1시간

export async function getExchangeRate(from: string, to: string): Promise<number> {
  const cacheKey = `${from}_${to}`;
  const now = Date.now();

  // 1) 캐시가 살아 있으면 바로 반환
  if (cache[cacheKey] && now - cacheTimestamps[cacheKey] < TTL) {
    return cache[cacheKey];
  }

  // 2) API 호출
  const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${from}`;
  const { data } = await axios.get<ExchangeRateResponse>(url);

  if (data.result !== "success") {
    throw new Error(`환율 API 오류: result=${data.result}`);
  }
  const rate = data.conversion_rates[to];
  if (rate == null) {
    throw new Error(`환율 데이터에 '${to}' 정보가 없습니다.`);
  }

  // 3) 캐시에 저장 후 반환
  cache[cacheKey] = rate;
  cacheTimestamps[cacheKey] = now;
  console.log(`[환율] 1 ${from} = ${rate} ${to}`);

  return rate;
}
