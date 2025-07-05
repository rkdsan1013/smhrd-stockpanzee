// /frontend/src/components/TickerItem.tsx
import React from "react";
import type { FC } from "react";

export type Ticker = {
  id: number;
  name: string;
  symbol: string;
  currentPrice: number;
  priceChange: number;
  marketCap: number;
  market: string;
};

interface Props {
  ticker: Ticker;
  flash: "up" | "down" | null;
  onClick: (id: number) => void;
}

const TickerItem: FC<Props> = ({ ticker, flash, onClick }) => {
  const colorClass =
    flash === "up" ? "text-green-300" : flash === "down" ? "text-red-300" : "text-white";

  return (
    <div
      className="flex items-center gap-1 px-5 hover:bg-gray-800 rounded cursor-pointer"
      style={{
        minWidth: 120,
        height: "100%",
        transition: "background 0.2s",
      }}
      onClick={() => onClick(ticker.id)}
    >
      <span className="font-semibold text-white">{ticker.name}</span>
      <span className="ml-1 text-gray-400 text-xs">{ticker.symbol}</span>
      <span className={`ml-2 font-bold transition-colors duration-700 ease-out ${colorClass}`}>
        {ticker.currentPrice.toLocaleString()}
      </span>
      <span
        className={`ml-2 font-semibold text-sm ${
          ticker.priceChange > 0
            ? "text-green-400"
            : ticker.priceChange < 0
              ? "text-red-400"
              : "text-gray-300"
        }`}
      >
        {ticker.priceChange.toFixed(2)}%
      </span>
    </div>
  );
};

export default React.memo(
  TickerItem,
  (prev, next) =>
    prev.ticker.currentPrice === next.ticker.currentPrice &&
    prev.ticker.priceChange === next.ticker.priceChange &&
    prev.flash === next.flash,
);
