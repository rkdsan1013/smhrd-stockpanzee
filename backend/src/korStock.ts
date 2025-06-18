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

// ✅ 토큰 발급
async function getAccessToken() {
  const url = "https://openapivts.koreainvestment.com:29443/oauth2/tokenP";
  const headers = { "Content-Type": "application/json" };
  const body = {
    grant_type: "client_credentials",
    appkey: process.env.APP_KEY,
    appsecret: process.env.APP_SECRET,
  };

  try {
    const res = await axios.post<TokenResponse>(url, body, { headers });
    accessToken = res.data.access_token;
    console.log("✅ ACCESS_TOKEN 발급 성공");
  } catch (err) {
    console.error("❌ ACCESS_TOKEN 발급 실패", err);
  }
}

// ✅ 단일 종목 시세 조회 + 전일가 역산
async function fetchFullPriceInfo(symbol: string): Promise<{
  symbol: string;
  price: number | null;
  prevPrice: number | null;
}> {
  const url = "https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/quotations/inquire-price";
  const headers = {
    "Content-Type": "application/json",
    authorization: `Bearer ${accessToken}`,
    appkey: process.env.APP_KEY!,
    appsecret: process.env.APP_SECRET!,
    tr_id: "FHKST01010100"
  };
  const params = {
    fid_cond_mrkt_div_code: "J",
    fid_input_iscd: symbol
  };

  try {
    const res = await axios.get<{ output: any }>(url, { headers, params });
    const output = res.data.output;

    console.log(`📡 ${symbol} 응답:`, JSON.stringify(output, null, 2));

    const rawPrice = output?.stck_prpr;
    const rawDiff = output?.prdy_vrss;

    const price = Number(rawPrice);
    const diff = Number(rawDiff);

    // ✅ 전일가 계산 (diff는 부호 포함값)
    const prevPrice = !isNaN(price) && !isNaN(diff) ? price - diff : null;

    if (isNaN(price) || prevPrice === null || isNaN(prevPrice)) {
      console.warn(`⚠️ ${symbol} 변환 실패 → price='${rawPrice}', diff='${rawDiff}'`);
      return { symbol, price: null, prevPrice: null };
    }

    return { symbol, price, prevPrice };
  } catch (err: any) {
    console.error(`❌ ${symbol} 조회 실패:`, err?.response?.data || err.message);
    return { symbol, price: null, prevPrice: null };
  }
}

// ✅ 실시간 시세 전송 및 로그 출력
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

  const selected = stockList.filter(stock =>
    ["035720", "091990"].includes(stock.symbol)
  );

  const results = await Promise.all(
    selected.map(stock => fetchFullPriceInfo(stock.symbol))
  );

  results.forEach(({ symbol, price, prevPrice }) => {
    const stock = selected.find(s => s.symbol === symbol);
    const name = stock?.name || "알 수 없음";

    console.log(`🔍 [DEBUG] ${symbol} | ${name} | price=${price}, prevPrice=${prevPrice}`);

    if (price !== null && prevPrice !== null) {
      const diff = price - prevPrice;
      const rate = ((diff / prevPrice) * 100).toFixed(2);
      const arrow = diff > 0 ? "🔺" : diff < 0 ? "🔻" : "⏸️";

      io.emit("stockPrice", { symbol, name, price, prevPrice, diff, rate });

      console.log(`${arrow} ${name} (${symbol}) 현재가: ${price.toLocaleString()}원 | 전일대비: ${diff.toLocaleString()}원 (${rate}%)`);
    } else {
      console.warn(`⚠️ ${name} (${symbol}) 가격 조회 실패`);
    }
  });
}
