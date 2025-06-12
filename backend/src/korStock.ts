import express from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

let cachedStockList: any[] = []; // 종목리스트 캐시
let lastFetchedTime = 0; // 캐시 만료 확인용

// ✅ 토큰 발급
const getAccessToken = async () => {
  const res = await axios.post(
    "https://openapi.koreainvestment.com:9443/oauth2/tokenP",
    {
      grant_type: "client_credentials",
      appkey: process.env.APP_KEY,
      appsecret: process.env.APP_SECRET,
    },
    { headers: { "content-type": "application/json" } }
  );
  return res.data.access_token;
};

// ✅ 전체 종목리스트 불러오기 (캐싱 적용)
const getStockList = async () => {
  const now = Date.now();
  if (cachedStockList.length > 0 && now - lastFetchedTime < 1000 * 60 * 60) {
    return cachedStockList;
  }

  const token = await getAccessToken();
  const res = await axios.get(
    "https://openapi.koreainvestment.com:9443/uapi/domestic-stock/v1/quotations/inquire-dmstc-com-stocklist",
    {
      headers: {
        authorization: `Bearer ${token}`,
        appkey: process.env.APP_KEY!,
        appsecret: process.env.APP_SECRET!,
        tr_id: "FHKST01010400",
      },
      params: {
        fid_cond_mrkt_div_code: "J",
        fid_input_iscd: "",
      },
    }
  );

  cachedStockList = res.data.output;
  lastFetchedTime = now;
  return cachedStockList;
};

// ✅ 종목리스트 API
router.get("/api/stock/list", async (req, res) => {
  try {
    const list = await getStockList();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: "종목리스트 불러오기 실패" });
  }
});

// ✅ 실시간 주가 조회
router.get("/api/stock/price", async (req, res) => {
  try {
    const token = await getAccessToken();
    const { code } = req.query;

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
          fid_cond_mrkt_div_code: "J",
          fid_input_iscd: code,
        },
      }
    );

    res.json(response.data.output);
  } catch (err) {
    res.status(500).json({ error: "실시간 주가 조회 실패" });
  }
});

export default router;