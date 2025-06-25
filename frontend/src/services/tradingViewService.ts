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
 * symbol과 market 정보를 TradingView 형식으로 변환합니다.
 */
export function getTradingViewSymbol(symbol: string, market: string): string {
  const exch = market.toUpperCase();
  const base = symbol.toUpperCase();
  switch (exch) {
    case "KRX":
    case "KOSPI":
    case "KOSDAQ":
      return `KRX:${base.split(".")[0]}`;
    case "NASDAQ":
    case "NYSE":
      return `${exch}:${base}`;
    case "BINANCE":
      const pair = base.endsWith("USDT") ? base : `${base}USDT`;
      return `BINANCE:${pair}`;
    default:
      return `${exch}:${base}`;
  }
}

/**
 * 지정된 container에 TradingView 위젯을 렌더링합니다.
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
