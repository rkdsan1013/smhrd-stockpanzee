// /backend/src/services/emitStockPrices.ts

import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { RowDataPacket } from "mysql2";
import pool from "../config/db";
import type { Server as IOServer } from "socket.io";

let accessToken = "";

/**
 * 1) ACCESS TOKEN 발급
 */
async function getAccessToken(): Promise<void> {
  try {
    const { data } = await axios.post<{ access_token: string }>(
      "https://openapi.koreainvestment.com:9443/oauth2/tokenP",
      {
        grant_type: "client_credentials",
        appkey: process.env.APP_KEY,
        appsecret: process.env.APP_SECRET,
      },
      { headers: { "Content-Type": "application/json" } },
    );
    accessToken = data.access_token;
    console.log("✅ ACCESS_TOKEN 발급 성공");
  } catch (err: any) {
    console.error("❌ ACCESS_TOKEN 발급 실패:", err.message || err);
    throw err;
  }
}

/**
 * 2) 단일 종목 시세 조회
 *    - 간단 retry: socket hang up 오류 시 최대 2회 재시도
 */
async function fetchFullPriceInfo(
  symbol: string,
  tries = 2,
): Promise<{
  symbol: string;
  price: number | null;
  prev: number | null;
  cap: number | null;
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

  try {
    const { data } = await axios.get<{ output: any }>(url, {
      headers,
      params: {
        fid_cond_mrkt_div_code: "J",
        fid_input_iscd: symbol,
      },
      timeout: 10_000,
    });

    const o = Number(data.output.stck_prpr);
    const d = Number(data.output.prdy_vrss);
    const s = Number(data.output.lstn_stcn);

    const price = isNaN(o) ? null : o;
    const prev = !price || isNaN(d) ? null : o - d;
    const cap = !price || isNaN(s) ? null : o * s;

    return { symbol, price, prev, cap };
  } catch (err: any) {
    // socket hang up 시 재시도
    if (tries > 0 && /socket hang up/.test(err.message)) {
      console.warn(`🔄 [${symbol}] 네트워크 에러, 재시도 남음(${tries})`);
      await new Promise((r) => setTimeout(r, 1000));
      return fetchFullPriceInfo(symbol, tries - 1);
    }
    console.error(`❌ [${symbol}] 시세 조회 실패:`, err.message || err);
    return { symbol, price: null, prev: null, cap: null };
  }
}

/**
 * 3) asset_info 테이블에 저장
 *    - prev가 0이거나 null일 땐 changePct를 0으로 설정
 */
async function saveToAssetInfo(params: {
  assetId: number;
  price: number;
  prev: number | null;
  cap: number;
}): Promise<boolean> {
  const { assetId, price, prev, cap } = params;

  // 분모가 0이거나 null일 경우 등락률 0
  const changePct = !prev || prev <= 0 ? 0 : ((price - prev) / prev) * 100;

  try {
    await pool.execute(
      `INSERT INTO asset_info
         (asset_id, current_price, price_change, market_cap, last_updated)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         current_price = VALUES(current_price),
         price_change  = VALUES(price_change),
         market_cap    = VALUES(market_cap),
         last_updated  = NOW()`,
      [assetId, price, changePct, cap],
    );
    return true;
  } catch (err: any) {
    console.error(`❌ asset_info 저장 실패 (asset_id=${assetId}):`, err.message || err);
    return false;
  }
}

/** 4) 대기 유틸 */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * 5) 메인 함수: socket.io에 실시간 주가 emit & DB 저장
 */
export async function emitStockPrices(io: IOServer): Promise<void> {
  console.log("🟡 emitStockPrices 시작");

  // 1) 토큰 확보
  if (!accessToken) {
    await getAccessToken();
  }

  // 2) DB에서 자산 리스트(id, symbol, name) 조회
  const [rows] = await pool.query<RowDataPacket[] & { id: number; symbol: string; name: string }[]>(
    `SELECT id, symbol, name
       FROM assets
      WHERE market IN ('KOSPI','KOSDAQ')`,
  );
  const stocks = rows as { id: number; symbol: string; name: string }[];
  console.log(`▶️ 조회할 종목 수: ${stocks.length}`);

  const chunkSize = 30;
  let successCount = 0;
  let failCount = 0;
  let loggedOk = false;
  let loggedErr = false;

  // 3) 청크 단위 처리
  for (let i = 0; i < stocks.length; i += chunkSize) {
    const batch = stocks.slice(i, i + chunkSize);
    const infos = await Promise.all(batch.map((s) => fetchFullPriceInfo(s.symbol)));

    for (const info of infos) {
      const meta = batch.find((s) => s.symbol === info.symbol)!;
      const { id: assetId, name } = meta;

      // price, prev, cap 모두 null 아님을 체크
      if (info.price != null && info.prev != null && info.cap != null) {
        const diff = info.price - info.prev;
        const pct = (diff / info.prev) * 100;
        const arrow = diff > 0 ? "🔺" : diff < 0 ? "🔻" : "⏸️";

        io.emit("stockPrice", {
          symbol: info.symbol,
          name,
          price: info.price,
          prevPrice: info.prev,
          diff,
          rate: pct.toFixed(2),
          marketCap: info.cap,
        });

        const ok = await saveToAssetInfo({
          assetId,
          price: info.price,
          prev: info.prev,
          cap: info.cap,
        });
        if (ok) {
          successCount++;
          if (!loggedOk) {
            console.log(`${arrow} ${name}(${info.symbol}) ${pct.toFixed(2)}%`);
            loggedOk = true;
          }
        } else {
          failCount++;
          if (!loggedErr) {
            console.warn(`⚠️ DB 저장 오류: ${name}(${info.symbol})`);
            loggedErr = true;
          }
        }
      } else {
        failCount++;
        if (!loggedErr) {
          console.warn(`⚠️ 조회 실패: ${name}(${info.symbol})`);
          loggedErr = true;
        }
      }
    }

    if (i + chunkSize < stocks.length) {
      await sleep(2000);
    }
  }

  console.log(`✅ emitStockPrices 완료: 성공 ${successCount} / 실패 ${failCount}`);
}
