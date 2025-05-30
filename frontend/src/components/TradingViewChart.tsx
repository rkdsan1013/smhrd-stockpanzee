import React, { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol: string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ symbol }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const wrapper = wrapperRef.current;
    wrapper.innerHTML = "";

    // 1) placeholder for the chart
    const chartId = `tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const placeholder = document.createElement("div");
    placeholder.id = chartId;
    wrapper.appendChild(placeholder);

    // 2) the embed script as a sibling
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "kr",
      enable_publishing: false,
      hide_top_toolbar: false,
      allow_symbol_change: true,
      container_id: chartId,
    });
    wrapper.appendChild(script);
  }, [symbol]);

  return <div ref={wrapperRef} className="tradingview-widget-container" style={{ height: 500 }} />;
};

export default TradingViewChart;
