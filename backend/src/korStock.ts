// import axios from "axios";
// import fs from "fs";
// import path from "path";
// import dotenv from "dotenv";
// dotenv.config();

// let accessToken = "";

// // ✅ 토큰 발급 함수 (자동 발급)
// async function getAccessToken() {
//   const url = "https://openapivts.koreainvestment.com:29443/oauth2/tokenP";

//   const headers = {
//     "Content-Type": "application/json"
//   };

//   const body = {
//     grant_type: "client_credentials",
//     appkey: process.env.APP_KEY,
//     appsecret: process.env.APP_SECRET
//   };

//   try {
//     const response = await axios.post(url, body, { headers });
//     accessToken = response.data.access_token;
//     console.log("✅ ACCESS_TOKEN 발급 성공");
//   } catch (error) {
//     console.error("❌ ACCESS_TOKEN 발급 실패", error);
//   }
// }

// // ✅ JSON 파일에서 종목코드 읽기
// const stockListPath = path.join(__dirname, "../krx_basic_info.json");
// const stockList: { ISU_SRT_CD: string; ISU_ABBRV: string }[] = JSON.parse(fs.readFileSync(stockListPath, "utf-8"));

// // ✅ 가격 조회 함수
// export async function emitStockPrices(io: any) {
//   if (!accessToken) {
//     await getAccessToken();
//     if (!accessToken) return;
//   }

//   for (let i = 0; i < stockList.length; i++) {
//     const stock = stockList[i];
//     const symbol = stock.ISU_SRT_CD;

//     const url = `https://openapivts.koreainvestment.com:29443/uapi/domestic-stock/v1/quotations/inquire-price`;
//     const headers = {
//       "Content-Type": "application/json",
//       authorization: `Bearer ${accessToken}`,
//       appkey: process.env.APP_KEY!,
//       appsecret: process.env.APP_SECRET!,
//       tr_id: "FHKST01010100"
//     };

//     const params = {
//       fid_cond_mrkt_div_code: "J",
//       fid_input_iscd: symbol
//     };

//     try {
//       const res = await axios.get(url, { headers, params });
//       const price = Number(res.data.output.stck_prpr);
//       io.emit("stockPrice", { symbol, price });
//       console.log(`${symbol} 가격: ${price}`);
//     } catch (err: any) {
//       console.error(`${symbol} 가격 조회 실패:`, err?.response?.data || err.message);
//     }
//   }
// }