// ✅ korStock.ts
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
    console.log("✅ ACCESS_TOKEN 발급 성공");
  } catch (err) {
    console.error("❌ ACCESS_TOKEN 발급 실패", err);
  }
}

// ✅ 시세 조회
async function fetchStock(symbol: string) {
  const url = "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price";
  const headers = {
    "Content-Type": "application/json",
    authorization: `Bearer ${accessToken}`,
    appkey: process.env.APP_KEY!,
    appsecret: process.env.APP_SECRET!,
    tr_id: "FHKST01010100",
  };
  const params = { fid_cond_mrkt_div_code: "J", fid_input_iscd: symbol };

  try {
    const res = await axios.get<{ output: any }>(url, { headers, params });
    const o = res.data.output;
    const price = Number(o.stck_prpr);
    const diff = Number(o.prdy_vrss);
    const prevPrice = !isNaN(price) && !isNaN(diff) ? price - diff : null;
    const shares = Number(o.lstn_stcn);
    const marketCap = !isNaN(price) && !isNaN(shares) ? price * shares : null;
    return { symbol, price, prevPrice, diff, marketCap };
  } catch (err) {
    console.error(`❌ ${symbol} 조회 실패`, err);
    return { symbol, price: null, prevPrice: null, diff: null, marketCap: null };
  }
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// ✅ 실시간 25개 emit
export async function emitLiveStocks(io: any, top25: StockItem[]) {
  if (!accessToken) await getAccessToken();
  console.log("📡 실시간 주식 emit 시작");

  for (let i = 0; i < top25.length; i += 5) {
    const chunk = top25.slice(i, i + 5);
    const results = await Promise.all(chunk.map(s => fetchStock(s.symbol)));
    for (const res of results) {
      if (res.price && res.prevPrice) {
        const rate = ((res.diff! / res.prevPrice) * 100).toFixed(2);
        io.emit("stockPrice", {
          symbol: res.symbol,
          price: res.price,
          prevPrice: res.prevPrice,
          diff: res.diff,
          rate,
          marketCap: res.marketCap,
        });
        console.log(`📢 ${res.symbol} ${res.price} (${rate}%)`);
      }
    }
    await sleep(1000); // 초당 5개 제한 준수
  }
}

// ✅ 나머지 종목 5분마다 조회 (DB 저장 제거됨)
export async function updateDBStocks() {
  const rest = stockList.filter(s => s.market === "KOSPI" || s.market === "KOSDAQ").slice(25);
  if (!accessToken) await getAccessToken();
  console.log("💾 비인기 주식 조회 시작");

  for (let i = 0; i < rest.length; i += 5) {
    const chunk = rest.slice(i, i + 5);
    const results = await Promise.all(chunk.map(s => fetchStock(s.symbol)));
    for (const res of results) {
      if (res.price && res.marketCap) {
        console.log(`✅ [조회] ${res.symbol} ${res.price}`);
      }
    }
    await sleep(1000);
  }
}
