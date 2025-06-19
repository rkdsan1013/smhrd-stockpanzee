// /frontend/src/services/tradingViewService.ts

let scriptLoadingPromise: Promise<void> | null = null;

/**
 * 동적으로 TradingView 위젯 스크립트를 로드합니다.
 */
export function loadTradingViewScript(): Promise<void> {
  if (scriptLoadingPromise) return scriptLoadingPromise;
  scriptLoadingPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
  return scriptLoadingPromise;
}

/**
 * DB에서 가져온 symbol과 market 정보를 TradingView가 이해하는 형식으로 변환합니다.
 * 예) ("005930.KQ", "KOSPI") => "KRX:005930"
 */
export function getTradingViewSymbol(symbol: string, market: string): string {
  const base = symbol.split(".")[0].toUpperCase();
  switch (market.toUpperCase()) {
    case "KRX":
    case "KOSPI":
    case "KOSDAQ":
      return `KRX:${base}`;
    case "NASDAQ":
    case "NYSE":
      return base;
    case "BINANCE":
    case "CRYPTO":
      return `BINANCE:${base}`;
    default:
      return base;
  }
}

/**
 * 지정된 container에 TradingView 위젯을 렌더링합니다.
 * @param containerId 대상 div의 id
 * @param tvSymbol TradingView 심볼 (예: "KRX:005930", "AAPL", "BINANCE:BTCUSDT")
 * @param width 위젯 가로 크기 (기본 "100%")
 * @param height 위젯 세로 크기 (기본 500)
 */
export async function renderTradingViewChart(
  containerId: string,
  tvSymbol: string,
  width: string | number = "100%",
  height: string | number = 500,
): Promise<void> {
  await loadTradingViewScript();
  // @ts-ignore
  new window.TradingView.widget({
    symbol: tvSymbol,
    interval: "D",
    container_id: containerId,
    width,
    height,
    theme: "dark",
    style: "1",
    locale: "ko",
    enable_publishing: false,
    allow_symbol_change: false,
    hide_top_toolbar: false,
  });
}
