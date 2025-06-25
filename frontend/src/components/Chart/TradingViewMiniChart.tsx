import React, { useRef, useEffect } from "react";

export const TradingViewMiniChart: React.FC<{ symbol?: string }> = ({ symbol }) => {
  const ref = useRef<HTMLDivElement>(null);

  // 심볼이 비어있거나, null, undefined, "null", "undefined"이면 로고
  const noSymbol =
    !symbol ||
    symbol.trim() === "" ||
    symbol === "null" ||
    symbol === "undefined" ||
    symbol === null ||
    symbol === undefined;

  if (noSymbol) {
    return (
      <div
        className="flex justify-center items-center"
        style={{
          width: 350,
          height: 220,
          borderRadius: 12,
        }}
      >
        <img
          src="/logo.svg"
          alt="팬지로고"
          style={{
            width: 220,
            height: 220,
            opacity: 0.75,
            filter: "drop-shadow(0 0 12px #2228)",
          }}
        />
      </div>
    );
  }

  useEffect(() => {
    if (ref.current) ref.current.innerHTML = "";
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.innerHTML = JSON.stringify({
      symbol,
      width: 440,
      height: 220,
      locale: "kr",
      dateRange: "D",
      colorTheme: "dark",
      isTransparent: false,
      autosize: false,
      largeChartUrl: "",
    });
    if (ref.current) ref.current.appendChild(script);
  }, [symbol]);

  return (
    <div
      className="tradingview-widget-container flex justify-center items-center"
      style={{
        width: 440,
        height: 220,
      }}
      ref={ref}
    />
  );
};
