import requests
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from threading import Timer

app = FastAPI()

# CORS 허용 (프론트 접근 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 한국투자증권 API 설정
APP_KEY = "PStyfs4eYLIVcdsf3bXii5meHKKt7XmjhwfT";
APP_SECRET = "c3r7pXnqpUFomJjuXsSgTsjpapeEnry3Hd3eLiV53NYJAsH6QIdKRUyhOkXugZcnHKzrre7zI5cTYx4WoGfv0o7G38tLw9M61ynfqXwH35FQnXELv4vMaVAhp3WiwR9MVKiOpYVoiY9vh3syTEcAPULDNWOwk44KAPsLfvPBGaNa/U0AZq8=";
BASE_URL = "https://openapi.koreainvestment.com:9443"

# 토큰 저장 변수 (초기값 None)
ACCESS_TOKEN = None

# 토큰 발급 함수
def fetch_access_token():
    global ACCESS_TOKEN

    url = f"{BASE_URL}/oauth2/tokenP"
    headers = {"content-type": "application/json"}
    payload = {
        "grant_type": "client_credentials",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET
    }

    response = requests.post(url, headers=headers, json=payload)
    data = response.json()

    if "access_token" not in data:
        raise Exception("토큰 발급 실패!")

    ACCESS_TOKEN = data['access_token']
    print(f"✅ 새로운 토큰 발급됨: {ACCESS_TOKEN[:10]}...")

    # 12시간 후 다시 갱신 예약 (43,200초)
    Timer(43200, fetch_access_token).start()

# 서버 시작시 토큰 발급
@app.on_event("startup")
def startup_event():
    fetch_access_token()

# 종목 일자별 시세 API
@app.get("/api/stock/{ticker}")
def get_stock_chart(ticker: str):
    global ACCESS_TOKEN

    if not ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="토큰이 존재하지 않음")

    headers = {
        "content-type": "application/json",
        "authorization": f"Bearer {ACCESS_TOKEN}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": "FHKST03010100"
    }

    url = f"{BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice"
    params = {
        "fid_cond_mrkt_div_code": "J",
        "fid_input_iscd": ticker,
        "fid_input_date_1": "20240101",
        "fid_input_date_2": "20250610",
        "fid_period_div_code": "D",
        "fid_org_adj_prc": "0"
    }

    response = requests.get(url, headers=headers, params=params)
    data = response.json()

    if 'output' not in data:
        raise HTTPException(status_code=500, detail="API 호출 실패")

    candles = [
        {
            "time": int(item['stck_bsop_date']),
            "open": float(item['stck_oprc']),
            "high": float(item['stck_hgpr']),
            "low": float(item['stck_lwpr']),
            "close": float(item['stck_clpr'])
        }
        for item in reversed(data['output'])
    ]

    return {"candles": candles}