import React, { useEffect, useRef } from 'react';
import { createChart, CrosshairMode, type CandlestickData, type Time, type IChartApi } from 'lightweight-charts';

interface Candle {
  time: number;  // unix timestamp (초단위)
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Props {
  data: Candle[];
}

const StockChart: React.FC<Props> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  const convertToCandlestickData = (data: Candle[]): CandlestickData[] => {
    return data.map(item => ({
      time: (item.time as Time),  // 타입 단언으로 변환
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));
  };

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      width: chartRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#111' },
        textColor: '#ccc',
      },
      crosshair: { mode: CrosshairMode.Normal },
      grid: {
        vertLines: { color: '#333' },
        horzLines: { color: '#333' },
      },
    }) as IChartApi;

    const candleSeries = chart.addCandlestickSeries();
    const chartData = convertToCandlestickData(data);
    candleSeries.setData(chartData);

    // 차트 클린업
    return () => chart.remove();
  }, [data]);

  return <div ref={chartRef} style={{ width: '100%', height: 500 }} />;
};

export default StockChart;