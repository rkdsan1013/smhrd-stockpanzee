import React, { useState } from "react";
import TradingViewChart from "../components/TradingViewChart";
import MarketSummary from "../components/MarketSummary";

const SymbolPage: React.FC = () => {
  const [symbol, setSymbol] = useState("NASDAQ:AAPL");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSymbol(e.target.value.toUpperCase());
  };

  return (
    <div className="flex flex-col md:flex-row items-start justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="md:w-2/3 w-full md:mr-4">
        <h1 className="text-3xl font-bold mb-6">📈 실시간 차트 테스트</h1>
        <div className="flex space-x-2 mb-4">
          <input
            value={symbol}
            onChange={handleInputChange}
            placeholder="Enter symbol (e.g. NASDAQ:AAPL)"
            className="px-4 py-2 text-black rounded-md w-full"
          />
        </div>
        <TradingViewChart symbol={symbol} />
      </div>
      <div className="md:w-1/3 w-full mt-8 md:mt-0">
        <MarketSummary />
      </div>
    </div>
  );
};

export default SymbolPage;
