export function getTradingViewSymbol(symbol: string, market: string): string {
  const baseSymbol = symbol.split(".")[0].toUpperCase();

  switch (market.toUpperCase()) {
    case "KRX":
    case "KOSPI":
    case "KOSDAQ":
      return `KRX:${baseSymbol}`;
    case "NYSE":
    case "NASDAQ":
      return baseSymbol; // e.g. AAPL
    case "CRYPTO":
    case "BINANCE":
      return `BINANCE:${baseSymbol}`; // e.g. BTCUSDT
    default:
      return baseSymbol;
  }
}
