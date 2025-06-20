import React, { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol: string; // TradingView symbol, e.g. "KRX:005930", "AAPL"
  width?: string | number;
  height?: string | number;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol,
  width = "100%",
  height = 500,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing chart
    containerRef.current.innerHTML = "";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if ((window as any).TradingView) {
        new (window as any).TradingView.widget({
          symbol,
          interval: "D",
          container_id: containerRef.current!.id,
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
    };

    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div>
      <div ref={containerRef} id={`tv-chart-${symbol.replace(/[:.]/g, "_")}`} />
    </div>
  );
};

export default TradingViewChart;
