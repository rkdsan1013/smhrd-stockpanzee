import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import pool from "./config/db"; // ✅ DB 연결

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

// ✅ ACCESS TOKEN 발급
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

// ✅ 단일 종목 시세 조회
async function fetchFullPriceInfo(symbol: string): Promise<{
  symbol: string;
  price: number | null;
  prevPrice: number | null;
  marketCap: number | null;
}> {
  const url =
    "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price";
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

    const price = Number(output?.stck_prpr);
    const diff = Number(output?.prdy_vrss);
    const shares = Number(output?.lstn_stcn);

    const prevPrice = !isNaN(price) && !isNaN(diff) ? price - diff : null;
    const marketCap = !isNaN(price) && !isNaN(shares) ? price * shares : null;

    return { symbol, price, prevPrice, marketCap };
  } catch (err: any) {
    console.error(`❌ ${symbol} 조회 실패:`, err?.response?.data || err.message);
    return { symbol, price: null, prevPrice: null, marketCap: null };
  }
}

// ✅ DB 저장 - 가격 차이 말고 등락률(rate) 저장
async function saveToAssetInfo({
  symbol,
  name,
  price,
  rate,
  marketCap,
}: {
  symbol: string;
  name: string;
  price: number;
  rate: number; // ✅ 퍼센트 값
  marketCap: number;
}) {
  try {
    const [rows]: any = await pool.query("SELECT id FROM assets WHERE symbol = ?", [symbol]);
    if (!rows.length) {
      console.warn(`⚠️ ${symbol} (${name}) → 자산 정보 없음`);
      return;
    }

    const assetId = rows[0].id;

    await pool.execute(
      `INSERT INTO asset_info 
        (asset_id, current_price, price_change, market_cap, last_updated, symbol) 
       VALUES (?, ?, ?, ?, NOW(), ?)
       ON DUPLICATE KEY UPDATE
         current_price = VALUES(current_price),
         price_change = VALUES(price_change),
         market_cap = VALUES(market_cap),
         last_updated = NOW()`,
      [assetId, price, rate, marketCap, symbol], // ✅ rate 저장
    );

    return true;
  } catch (err) {
    console.error(`❌ DB 저장 실패: ${symbol}`, err);
    return false;
  }
}

// ✅ 슬립 함수
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ✅ 전체 실행
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

  const targetStocks = stockList.filter(
    (stock) => stock.market === "KOSPI" || stock.market === "KOSDAQ",
  );
  const chunkSize = 30;
  let successCount = 0;
  let failCount = 0;
  let successLogShown = false;
  let failLogShown = false;

  for (let i = 0; i < targetStocks.length; i += chunkSize) {
    const chunk = targetStocks.slice(i, i + chunkSize);

    const results = await Promise.all(chunk.map((stock) => fetchFullPriceInfo(stock.symbol)));

    for (const { symbol, price, prevPrice, marketCap } of results) {
      const stock = chunk.find((s) => s.symbol === symbol);
      const name = stock?.name || "알 수 없음";

      if (price !== null && prevPrice !== null && marketCap !== null) {
        const diff = price - prevPrice;
        const rate = (diff / prevPrice) * 100; // ✅ 퍼센트 계산
        const arrow = diff > 0 ? "🔺" : diff < 0 ? "🔻" : "⏸️";

        io.emit("stockPrice", {
          symbol,
          name,
          price,
          prevPrice,
          diff,
          rate: rate.toFixed(2), // 소수점 둘째 자리까지
          marketCap,
        });

        const saved = await saveToAssetInfo({
          symbol,
          name,
          price,
          rate, // ✅ 저장
          marketCap,
        });

        if (saved) {
          successCount++;
          if (!successLogShown) {
            console.log(
              `${arrow} ${name} (${symbol}) 현재가: ${price} | 전일대비: ${rate.toFixed(2)}% | 시총: ${marketCap}`,
            );
            successLogShown = true;
          }
        } else {
          failCount++;
          if (!failLogShown) {
            console.warn(`⚠️ ${name} (${symbol}) DB 저장 실패`);
            failLogShown = true;
          }
        }
      } else {
        failCount++;
        if (!failLogShown) {
          console.warn(`⚠️ ${name} (${symbol}) 가격 조회 실패`);
          failLogShown = true;
        }
      }
    }

    if (i + chunkSize < targetStocks.length) {
      await sleep(2000); // 💤 과부하 방지
    }
  }

  console.log(`✅ 완료: 성공 ${successCount}개 / 실패 ${failCount}개`);
}
