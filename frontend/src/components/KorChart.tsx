import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface KorChartProps {
  symbol: string;
}

const KorChart: React.FC<KorChartProps> = ({ symbol }) => {
  const [prices, setPrices] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    const fetchRealTime = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/stock/price?code=${symbol}`);
        const json = await res.json();
        const price = parseFloat(json.output.stck_prpr);
        const time = new Date().toLocaleTimeString();

        setPrices(prev => [...prev.slice(-19), price]);
        setLabels(prev => [...prev.slice(-19), time]);
      } catch (err) {
        console.error("실시간 조회 실패:", err);
      }
    };

    fetchRealTime();
    const interval = setInterval(fetchRealTime, 5000);
    return () => clearInterval(interval);
  }, [symbol]);

  const data = {
    labels,
    datasets: [
      {
        label: "실시간 주가",
        data: prices,
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  return <Line data={data} />;
};

export default KorChart;