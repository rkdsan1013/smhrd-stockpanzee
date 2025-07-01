// /frontend/src/components/TradingViewTape.tsx
import React, { useEffect, useRef } from "react";

const TICKER_SYMBOLS = [
  // 주요 미국지수 + 미국 주식 (10개)
  { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
  { proName: "NASDAQ:IXIC", title: "NASDAQ" },
  { proName: "OANDA:US30USD", title: "Dow Jones" },
  { proName: "NASDAQ:NVDA", title: "NVIDIA" },
  { proName: "NASDAQ:MSFT", title: "Microsoft" },
  { proName: "NASDAQ:AAPL", title: "Apple" },
  { proName: "NASDAQ:TSLA", title: "Tesla" },
  { proName: "NASDAQ:NFLX", title: "Netflix" },
  { proName: "NASDAQ:META", title: "Meta" },
  { proName: "NASDAQ:AMZN", title: "Amazon" },

  // 암호화폐 (10개)
  { proName: "BINANCE:BTCUSDT", title: "BTC" },
  { proName: "BINANCE:ETHUSDT", title: "ETH" },
  { proName: "BINANCE:BNBUSDT", title: "BNB" },
  { proName: "BINANCE:SOLUSDT", title: "SOL" },
  { proName: "BINANCE:XRPUSDT", title: "XRP" },
  { proName: "BINANCE:ADAUSDT", title: "ADA" },
  { proName: "BINANCE:DOGEUSDT", title: "DOGE" },
  { proName: "BINANCE:AVAXUSDT", title: "AVAX" },
  { proName: "BINANCE:TONUSDT", title: "TON" },
  { proName: "BINANCE:LINKUSDT", title: "LINK" },
];

function TradingViewTape() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = "";
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: TICKER_SYMBOLS,
      colorTheme: "dark",
      locale: "en",
      isTransparent: false,
      displayMode: "adaptive",
      showSymbolLogo: true,
      largeChartUrl: "",
      autosize: true,
    });
    container.current.appendChild(script);
  }, []);

  return (
    <div
      className="tradingview-widget-container fixed left-0 right-0 bottom-0 w-screen bg-[#161b22] z-[99]"
      style={{
        bottom: "-2px",
        minHeight: 48,
        margin: 0,
        padding: 0,
        border: 0,
        boxShadow: "none",
        pointerEvents: "auto",
        width: "100vw",
      }}
      ref={container}
    >
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}

export default React.memo(TradingViewTape);