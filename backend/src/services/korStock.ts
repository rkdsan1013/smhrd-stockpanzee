import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

let accessToken = "";
let mockToken = "";

interface TokenResponse {
  access_token: string;
}

interface StockItem {
  symbol: string;
  name: string;
  market: string;
}

// ✅ 경로 수정: 같은 폴더 내 JSON 파일을 불러옵니다
const stockListPath = path.join(__dirname, "krx_basic_info.json");
const stockList: StockItem[] = JSON.parse(fs.readFileSync(stockListPath, "utf-8"));

// ✅ 실전토큰 발급
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

// ✅ 모의토큰 발급
async function getMockToken() {
  const url = "https://openapivts.koreainvestment.com:29443/oauth2/tokenP";
  const headers = { "Content-Type": "application/json" };
  const body = {
    grant_type: "client_credentials",
    appkey: process.env.MOCK_KEY,
    appsecret: process.env.MOCK_SECRET,
  };

  try {
    const res = await axios.post<TokenResponse>(url, body, { headers });
    mockToken = res.data.access_token;
    console.log("🧪 MOCK_TOKEN 발급 성공");
  } catch (err) {
    console.error("❌ MOCK_TOKEN 발급 실패", err);
  }
}

// ✅ 시세 조회 함수 (토큰 분기)
async function fetchStock(symbol: string, type: "real" | "mock" = "real") {
  const isMock = type === "mock";
  const token = isMock ? mockToken : accessToken;
  const baseURL = isMock
    ? "https://openapivts.koreainvestment.com:29443"
    : "https://openapi.koreainvestment.com:9443";

  const url = `${baseURL}/uapi/domestic-stock/v1/quotations/inquire-price`;
  const headers = {
    "Content-Type": "application/json",
    authorization: `Bearer ${token}`,
    appkey: isMock ? process.env.MOCK_KEY! : process.env.APP_KEY!,
    appsecret: isMock ? process.env.MOCK_SECRET! : process.env.APP_SECRET!,
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
    return { symbol, name: o.hts_kor_isnm, price, diff, prevPrice, marketCap };
  } catch (err) {
    console.error(`❌ [${type}] ${symbol} 조회 실패`, err);
    return { symbol, name: "", price: null, prevPrice: null, diff: null, marketCap: null };
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
    const results = await Promise.all(chunk.map(s => fetchStock(s.symbol, "real")));
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
    await sleep(1000);
  }
}

// ✅ 나머지 종목 (모의투자용) 콘솔 출력
export async function updateMockStocks() {
  const rest = stockList.filter(s => s.market === "KOSPI" || s.market === "KOSDAQ").slice(25);
  if (!mockToken) await getMockToken();
  console.log("🧪 MOCK 종목 콘솔 출력 시작");

  for (let i = 0; i < rest.length; i += 4) {
    const chunk = rest.slice(i, i + 4);
    const results = await Promise.all(chunk.map(s => fetchStock(s.symbol, "mock")));
    for (const res of results) {
      if (res.price && res.marketCap) {
        const rate = res.prevPrice ? ((res.diff! / res.prevPrice) * 100).toFixed(2) : "0.00";
        console.log(`✅ [MOCK 조회] ${res.name} (${res.symbol}) | 현재가: ${res.price} | 전일대비: ${res.diff} | 변동률: ${rate}% | 시가총액: ${res.marketCap.toLocaleString()}`);
      }
    }
    await sleep(1000);
  }
}
updateMockStocks();
