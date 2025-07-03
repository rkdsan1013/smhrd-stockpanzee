// /frontend/src/components/Chart/TradingViewMiniChart.tsx
import React, { useRef, useEffect } from "react";

export const TradingViewMiniChart: React.FC<{ symbol?: string }> = ({ symbol }) => {
  const ref = useRef<HTMLDivElement>(null);

  // 심볼이 비어있거나 유효하지 않으면 로고 표시
  const noSymbol = !symbol || symbol.trim() === "" || symbol === "null" || symbol === "undefined";

  if (noSymbol) {
    return (
      <div
        className="flex justify-center items-center rounded-2xl overflow-hidden"
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <img
          src="/logo.svg"
          alt="팬지로고"
          className="opacity-75"
          style={{
            width: "60%",
            height: "60%",
            filter: "drop-shadow(0 0 12px #2228)",
          }}
        />
      </div>
    );
  }

  useEffect(() => {
    if (!ref.current) return;
    // 기존 스크립트 클리어
    ref.current.innerHTML = "";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.innerHTML = JSON.stringify({
      symbol,
      // autosize 모드로 설정하면 width/height 불필요
      autosize: true,
      locale: "kr",
      dateRange: "1H",
      colorTheme: "dark",
      isTransparent: true,
      largeChartUrl: "",
    });

    ref.current.appendChild(script);
  }, [symbol]);

  return (
    <div
      ref={ref}
      className="tradingview-widget-container w-full h-full rounded-2xl overflow-hidden"
      style={{
        minHeight: 200,
      }}
    />
  );
};
