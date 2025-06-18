import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

let accessToken = "";

interface TokenResponse {
  access_token: string;
}

interface StockItem {
  symbol: string;
  name: string;
  market: string;
}

const stockListPath = path.join(__dirname, "../krx_basic_info.json");
const stockList: StockItem[] = JSON.parse(fs.readFileSync(stockListPath, "utf-8"));

// ✅ 실전용 ACCESS_TOKEN 발급
async function getAccessToken() {
  const url = "https://openapi.koreainvestment.com:9443/oauth2/tokenP";
  const headers = { "Content-Type": "application/json" };
  const body = {
    grant_type: "client_credentials",
    appkey: process.env.APP_KEY,
    appsecret: process.env.APP_SECRET,
  };

  try {
    const res = await axios.post<TokenResponse>(url, body, { headers });
    accessToken = res.data.access_token;
    console.log("✅ [실전] ACCESS_TOKEN 발급 성공");
  } catch (err) {
    console.error("❌ [실전] ACCESS_TOKEN 발급 실패", err);
  }
}

// ✅ 주가 + 전일가 + 시총 조회
async function fetchFullPriceInfo(symbol: string): Promise<{
  symbol: string;
  price: number | null;
  prevPrice: number | null;
  marketCap: number | null;
}> {
  const url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price";
  const headers = {
    "Content-Type": "application/json",
    authorization: `Bearer ${accessToken}`,
    appkey: process.env.APP_KEY!,
    appsecret: process.env.APP_SECRET!,
    tr_id: "FHKST01010100",
  };
  const params = {
    fid_cond_mrkt_div_code: "J",
    fid_input_iscd: symbol,
  };

  try {
    const res = await axios.get<{ output: any }>(url, { headers, params });
    const output = res.data.output;

    const rawPrice = output?.stck_prpr;
    const rawDiff = output?.prdy_vrss;
    const rawShares = output?.lstn_stcn;

    const price = Number(rawPrice);
    const diff = Number(rawDiff);
    const shares = Number(rawShares);

    const prevPrice = !isNaN(price) && !isNaN(diff) ? price - diff : null;
    const marketCap = !isNaN(price) && !isNaN(shares) ? price * shares : null;

    return { symbol, price, prevPrice, marketCap };
  } catch (err: any) {
    console.error(`❌ ${symbol} 조회 실패:`, err?.response?.data || err.message);
    return { symbol, price: null, prevPrice: null, marketCap: null };
  }
}

// ✅ 딜레이 함수
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ✅ 50개씩 나눠서 실전 시세 조회
export async function emitStockPrices(io: any) {
  console.log("🟡 emitStockPrices 실행됨");

  if (!accessToken) {
    console.log("🟡 ACCESS_TOKEN 없음 → 발급 시도");
    await getAccessToken();
    if (!accessToken) {
      console.error("❌ ACCESS_TOKEN 발급 실패 → emit 중단");
      return;
    }
  }

  const kospiStocks = stockList.filter(stock => stock.market === "KOSPI");
  const chunkSize = 30;

  for (let i = 0; i < kospiStocks.length; i += chunkSize) {
    const chunk = kospiStocks.slice(i, i + chunkSize);

    const results = await Promise.all(
      chunk.map(stock => fetchFullPriceInfo(stock.symbol))
    );

    results.forEach(({ symbol, price, prevPrice, marketCap }) => {
      const stock = chunk.find(s => s.symbol === symbol);
      const name = stock?.name || "알 수 없음";

      if (price !== null && prevPrice !== null) {
        const diff = price - prevPrice;
        const rate = ((diff / prevPrice) * 100).toFixed(2);
        const arrow = diff > 0 ? "🔺" : diff < 0 ? "🔻" : "⏸️";

        io.emit("stockPrice", {
          symbol,
          name,
          price,
          prevPrice,
          diff,
          rate,
          marketCap,
        });

        console.log(
          `${arrow} ${name} (${symbol}) 현재가: ${price} | 전일대비: ${diff} (${rate}%) | 시가총액: ${marketCap}`
        );
      } else {
        console.warn(`⚠️ ${name} (${symbol}) 가격 조회 실패`);
      }
    });

    // ✅ 과부하 방지 딜레이
    if (i + chunkSize < kospiStocks.length) {
      await sleep(2000); // ← 💡 30개 요청 후엔 1.5초 쉬기
    }
  }
}
