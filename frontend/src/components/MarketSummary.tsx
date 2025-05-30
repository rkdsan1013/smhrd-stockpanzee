import React, { useEffect, useRef } from "react";

// TradingView 위젯 설정 타입 정의
interface TradingViewWidgetSettings {
  symbol?: string;
  width: string | number;
  height: string | number;
  locale: string;
  colorTheme: string;
  isTransparent: boolean;
  autosize: boolean;
  dateRange?: string;
  largeChartUrl?: string;
  chartOnly?: boolean;
}

const MarketSummary: React.FC = () => {
  // 나스닥 지수 (NASDAQ:NDX)
  const nasdaqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = nasdaqRef.current;
    if (!wrapper) return;

    wrapper.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    wrapper.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";

    script.textContent = JSON.stringify({
      symbol: "NASDAQ:NDX",
      width: "100%",
      height: "100%",
      locale: "kr",
      dateRange: "12M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      chartOnly: false,
    } as TradingViewWidgetSettings);

    wrapper.appendChild(script);

    return () => {
      wrapper.innerHTML = "";
    };
  }, []);

  // S&P 500 (INDEX:SPX)
  const spxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = spxRef.current;
    if (!wrapper) return;

    wrapper.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    wrapper.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";

    script.textContent = JSON.stringify({
      symbol: "NASDAQ:QQQ", // SP:SPX 대신 INDEX:SPX 사용
      width: "100%",
      height: "100%",
      locale: "kr",
      dateRange: "12M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      chartOnly: false,
    } as TradingViewWidgetSettings);

    wrapper.appendChild(script);

    return () => {
      wrapper.innerHTML = "";
    };
  }, []);

  // USD/KRW (PEPPERSTONE:USDKRW)
  const usdkrwRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = usdkrwRef.current;
    if (!wrapper) return;

    wrapper.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    wrapper.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";

    script.textContent = JSON.stringify({
      symbol: "PEPPERSTONE:USDKRW",
      width: "100%",
      height: "100%",
      locale: "kr",
      dateRange: "12M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      chartOnly: false,
    } as TradingViewWidgetSettings);

    wrapper.appendChild(script);

    return () => {
      wrapper.innerHTML = "";
    };
  }, []);

  // 코스피 (INDEX:KOSPI)
  const kospiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = kospiRef.current;
    if (!wrapper) return;

    wrapper.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    wrapper.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";

    script.textContent = JSON.stringify({
      symbol: "OANDA:SPX500USD",
      width: "100%",
      height: "100%",
      locale: "kr",
      dateRange: "12M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      chartOnly: false,
    } as TradingViewWidgetSettings);

    wrapper.appendChild(script);

    return () => {
      wrapper.innerHTML = "";
    };
  }, []);

  // 코스닥 (INDEX:KOSDAQ)
  const kosdaqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = kosdaqRef.current;
    if (!wrapper) return;

    wrapper.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    wrapper.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";

    script.textContent = JSON.stringify({
      symbol: "BINANCE:BTCUSDT",
      width: "100%",
      height: "100%",
      locale: "kr",
      dateRange: "12M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      chartOnly: false,
    } as TradingViewWidgetSettings);

    wrapper.appendChild(script);

    return () => {
      wrapper.innerHTML = "";
    };
  }, []);

  // 다우존스 (DOW:DJI)
  const dowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = dowRef.current;
    if (!wrapper) return;

    wrapper.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    wrapper.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";

    script.textContent = JSON.stringify({
      symbol: "CMCMARKETS:USDJPY",
      width: "100%",
      height: "100%",
      locale: "kr",
      dateRange: "12M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      chartOnly: false,
    } as TradingViewWidgetSettings);

    wrapper.appendChild(script);

    return () => {
      wrapper.innerHTML = "";
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        ref={nasdaqRef}
        className="tradingview-widget-container h-[220px] w-full"
        style={{ backgroundColor: "transparent" }}
      />
      <div
        ref={spxRef}
        className="tradingview-widget-container h-[220px] w-full"
        style={{ backgroundColor: "transparent" }}
      />
      <div
        ref={usdkrwRef}
        className="tradingview-widget-container h-[220px] w-full"
        style={{ backgroundColor: "transparent" }}
      />
      <div
        ref={kospiRef}
        className="tradingview-widget-container h-[220px] w-full"
        style={{ backgroundColor: "transparent" }}
      />
      <div
        ref={kosdaqRef}
        className="tradingview-widget-container h-[220px] w-full"
        style={{ backgroundColor: "transparent" }}
      />
      <div
        ref={dowRef}
        className="tradingview-widget-container h-[220px] w-full"
        style={{ backgroundColor: "transparent" }}
      />
    </div>
  );
};

export default MarketSummary;
