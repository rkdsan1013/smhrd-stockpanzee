import React from "react";
import { useParams } from "react-router-dom";
import KorChart from "../components/KorChart";

const StockDetailPage: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();

  return (
    <div className="max-w-6xl mx-auto p-8 text-white">
      <h1 className="text-2xl font-bold mb-4">{symbol} 실시간 차트</h1>
      <KorChart symbol={symbol || "005930"} />
    </div>
  );
};

export default StockDetailPage;