// /backend/src/services/marketData/krxMarketService.ts
import axios from "axios";
import dotenv from "dotenv";
import pool from "../../config/db";
import { Server } from "socket.io";

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

// ✅ 실전투자 토큰 발급
async function getAccessToken() {
  try {
    const res = await axios.post<TokenResponse>(
      "https://openapi.koreainvestment.com:9443/oauth2/tokenP",
      {
        grant_type: "client_credentials",
        appkey: process.env.APP_KEY,
        appsecret: process.env.APP_SECRET,
      },
      { headers: { "Content-Type": "application/json" } },
    );
    accessToken = res.data.access_token;
    console.log("🔐 실전투자 토큰 발급 완료");
  } catch (err: any) {
    console.error("❌ 토큰 발급 실패 - 실전:", err.response?.data || err.message);
  }
}

// ✅ 모의투자 토큰 발급
async function getMockToken() {
  try {
    const res = await axios.post<TokenResponse>(
      "https://openapivts.koreainvestment.com:29443/oauth2/tokenP",
      {
        grant_type: "client_credentials",
        appkey: process.env.MOCK_KEY,
        appsecret: process.env.MOCK_SECRET,
      },
      { headers: { "Content-Type": "application/json" } },
    );
    mockToken = res.data.access_token;
    console.log("🔐 모의투자 토큰 발급 완료");
  } catch (err: any) {
    console.error("❌ 토큰 발급 실패 - 모의:", err.response?.data || err.message);
  }
}

// ✅ 주식 정보 조회
async function fetchStock(symbol: string, type: "real" | "mock") {
  const isMock = type === "mock";
  const baseURL = isMock
    ? "https://openapivts.koreainvestment.com:29443"
    : "https://openapi.koreainvestment.com:9443";
  const token = isMock ? mockToken : accessToken;

  try {
    const res = await axios.get<{ output: any }>(
      `${baseURL}/uapi/domestic-stock/v1/quotations/inquire-price`,
      {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
          appkey: isMock ? process.env.MOCK_KEY! : process.env.APP_KEY!,
          appsecret: isMock ? process.env.MOCK_SECRET! : process.env.APP_SECRET!,
          tr_id: "FHKST01010100",
        },
        params: {
          fid_cond_mrkt_div_code: "J",
          fid_input_iscd: symbol,
        },
      },
    );

    const o = res.data.output;
    const price = Number(o.stck_prpr);
    const diff = Number(o.prdy_vrss);
    const prevPrice = !isNaN(price) && !isNaN(diff) ? price - diff : null;
    const shares = Number(o.lstn_stcn);
    const marketCap = !isNaN(price) && !isNaN(shares) ? price * shares : null;

    return {
      symbol,
      name: o.hts_kor_isnm,
      market: o.rprs_mrkt_kor_name,
      price,
      diff,
      prevPrice,
      marketCap,
    };
  } catch (err: any) {
    console.error(
      `❌ 조회 실패 - ${type.toUpperCase()} ${symbol}:`,
      err.response?.data || err.message,
    );
    return {
      symbol,
      name: "",
      market: "",
      price: null,
      diff: null,
      prevPrice: null,
      marketCap: null,
    };
  }
}

// ✅ 슬립 유틸
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

// ✅ 모의투자 상위 25개 종목 실시간 emit
export async function emitMockTop25(io: Server) {
  if (!mockToken) await getMockToken();

  while (true) {
    console.log("🚀 모의투자 수집 시작 (상위 25개)");

    const [rows]: any = await pool.query(`
      SELECT a.symbol, a.name, a.market
      FROM asset_info i
      JOIN assets a ON i.asset_id = a.id
      WHERE a.market IN ('KOSPI', 'KOSDAQ')
      ORDER BY i.market_cap DESC
      LIMIT 25
    `);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < rows.length; i += 3) {
      const chunk = rows.slice(i, i + 3);
      const results = await Promise.all(
        chunk.map((stock: any) => fetchStock(stock.symbol, "mock")),
      );

      for (const res of results) {
        if (res.price && res.prevPrice) {
          const rate = ((res.diff! / res.prevPrice!) * 100).toFixed(2);
          io.emit("stockPrice", {
            symbol: res.symbol,
            price: res.price,
            diff: res.diff,
            prevPrice: res.prevPrice,
            rate,
            marketCap: res.marketCap,
          });

          successCount++;
        } else {
          failCount++;
        }
      }

      await sleep(2000);
    }

    console.log(`✅ 모의투자 전송 완료 - 성공 ${successCount}개 / 실패 ${failCount}개`);
    await sleep(5000);
  }
}

// ✅ 실전 종목 DB 저장
export async function updateRealToDB() {
  console.log("🚀 실전 종목 수집 시작");

  if (!accessToken) await getAccessToken();

  const [rows]: any = await pool.query(`
    SELECT id, symbol, name, market FROM assets
    WHERE market IN ('KOSPI', 'KOSDAQ')
  `);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < rows.length; i += 25) {
    const chunk = rows.slice(i, i + 25);
    const results = await Promise.all(
      chunk.map((asset: { symbol: string }) => fetchStock(asset.symbol, "real")),
    );

    for (let j = 0; j < chunk.length; j++) {
      const asset = chunk[j];
      const res = results[j];

      if (res.price == null || res.prevPrice == null || res.marketCap == null) {
        failCount++;
        continue;
      }

      try {
        const rate = Number(((res.diff! / res.prevPrice!) * 100).toFixed(2));

        await pool.execute(
          `INSERT INTO asset_info 
            (asset_id, current_price, price_change, market_cap, last_updated)
           VALUES (?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             current_price = VALUES(current_price),
             price_change = VALUES(price_change),
             market_cap = VALUES(market_cap),
             last_updated = NOW()`,
          [asset.id, res.price, rate, res.marketCap],
        );

        successCount++;
      } catch (e: any) {
        failCount++;
      }
    }

    await sleep(2000);
  }

  console.log(`✅ 실전 종목 저장 완료 - 성공 ${successCount}개 / 실패 ${failCount}개`);
}
