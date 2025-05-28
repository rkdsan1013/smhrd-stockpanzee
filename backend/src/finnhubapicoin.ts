import axios from "axios";
import fs from "fs/promises";

interface Coin {
  id: string;
  symbol: string;
  name: string;
}

interface Ticker {
  base: string;
  target: string;
  market: { name: string };
}

const COINS_FILE = "./binance_all_listed_coins.json";

async function fetchBinanceAllCoins(): Promise<void> {
  // Binance 거래쌍 목록 요청 (모든 코인 거래쌍 포함)
  const { data: tickerData } = await axios.get<{ tickers: Ticker[] }>(
    "https://api.coingecko.com/api/v3/exchanges/binance/tickers",
  );
  const tickers = tickerData.tickers;

  // 바이낸스에 상장된 코인의 base 심볼 목록 (소문자)
  const binanceSymbols = new Set(tickers.map((t) => t.base.toLowerCase()));

  // 모든 CoinGecko 코인 리스트 조회
  const { data: allCoins } = await axios.get<Coin[]>("https://api.coingecko.com/api/v3/coins/list");

  // Binance에 존재하는 코인만 필터링
  const listedCoins = allCoins.filter((coin) => binanceSymbols.has(coin.symbol.toLowerCase()));

  // name, symbol, market 형식으로 가공
  const formatted = listedCoins.map((coin) => ({
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
    market: "Binance",
  }));

  // 결과 저장
  await fs.writeFile(COINS_FILE, JSON.stringify(formatted, null, 2), "utf-8");
  console.log(`✅ 총 ${formatted.length}개 코인을 '${COINS_FILE}'에 저장 완료`);
}

fetchBinanceAllCoins();
