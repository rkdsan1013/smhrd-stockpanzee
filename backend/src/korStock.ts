import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// ✅ 한국투자증권 API 토큰 발급
const getAccessToken = async () => {
  const res = await axios.post(
    "https://openapi.koreainvestment.com:9443/oauth2/tokenP",
    {
      grant_type: "client_credentials",
      appkey: process.env.APP_KEY,
      appsecret: process.env.APP_SECRET,
    },
    {
      headers: { "content-type": "application/json" },
    }
  );
  return res.data.access_token;
};

// ✅ 실시간 주가 조회
router.get("/api/stock/price", async (req, res) => {
  try {
    const token = await getAccessToken();

    const response = await axios.get(
      "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-price",
      {
        headers: {
          authorization: `Bearer ${token}`,
          appkey: process.env.APP_KEY!,
          appsecret: process.env.APP_SECRET!,
          tr_id: "FHKST01010100",
        },
        params: {
          fid_cond_mrkt_div_code: "J", // KOSPI/KOSDAQ
          fid_input_iscd: "005930",    // 삼성전자 (기본)
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error("실시간 주가 조회 실패:", err);
    res.status(500).json({ error: "실시간 주가 조회 실패" });
  }
});

// ✅ 과거 일자별 주가 조회
router.get("/api/stock/history", async (req, res) => {
  try {
    const token = await getAccessToken();
    const { code = "005930", count = 30 } = req.query;

    const response = await axios.get(
      "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
      {
        headers: {
          authorization: `Bearer ${token}`,
          appkey: process.env.APP_KEY!,
          appsecret: process.env.APP_SECRET!,
          tr_id: "FHKST03010100",
        },
        params: {
          fid_cond_mrkt_div_code: "J",
          fid_input_iscd: code,
          fid_org_adj_prc: "0",
          fid_period_div_code: "D",
          fid_date: "", // 최근 일자 기준
          fid_idx: "0",
          fid_cnt: count,
        },
      }
    );

    res.json(response.data.output);
  } catch (err) {
    console.error("과거 주가 조회 실패:", err);
    res.status(500).json({ error: "과거 주가 조회 실패" });
  }
});

export default router;
