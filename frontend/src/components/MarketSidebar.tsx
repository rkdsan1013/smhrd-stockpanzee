// /frontend/src/components/MarketSidebar.tsx
import React from "react";
import Icons from "./Icons";
import Tooltip from "./Tooltip";
import { formatPercentage } from "../utils/formats";

interface StockItem {
  id: number;
  name: string;
  priceChange: number;
}

interface MarketSidebarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusTitle: string;
  largeUp: number;
  smallUp: number;
  zero: number;
  smallDown: number;
  largeDown: number;
  upPct: number;
  downPct: number;
  volatility: number;
  topGainers: StockItem[];
  topLosers: StockItem[];
  onMomentumClick: (id: number) => void;
}

const MarketSidebar: React.FC<MarketSidebarProps> = ({
  search,
  onSearchChange,
  statusTitle,
  largeUp,
  smallUp,
  zero,
  smallDown,
  largeDown,
  upPct,
  downPct,
  volatility,
  topGainers,
  topLosers,
  onMomentumClick,
}) => (
  <div className="sticky top-20 space-y-4">
    {/* Search */}
    <div className="relative">
      <Icons
        name="search"
        className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2"
      />
      <input
        type="text"
        placeholder="종목명·심볼 검색"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 p-2 rounded-lg bg-gray-800 text-white placeholder-gray-500"
      />
    </div>

    {/* Summary Card */}
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 text-white">
      <h2 className="text-xl font-bold text-center">{statusTitle}</h2>

      {/* 5-step bar */}
      <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden flex">
        {[
          { cnt: largeUp, color: "bg-green-700", label: `큰 상승: ${largeUp}` },
          { cnt: smallUp, color: "bg-green-400", label: `상승: ${smallUp}` },
          { cnt: zero, color: "bg-gray-500", label: `변동 없음: ${zero}` },
          { cnt: smallDown, color: "bg-red-400", label: `하락: ${smallDown}` },
          { cnt: largeDown, color: "bg-red-700", label: `큰 하락: ${largeDown}` },
        ].map(({ cnt, color, label }) => {
          const pct = (cnt / (largeUp + smallUp + zero + smallDown + largeDown)) * 100;
          return (
            <Tooltip key={label} label={label} style={{ width: `${pct}%` }}>
              <div className={`${color} h-full`} />
            </Tooltip>
          );
        })}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon: "caretUp",
            color: "text-green-400",
            label: "상승 비율",
            value: `${upPct.toFixed(1)}%`,
          },
          {
            icon: "caretDown",
            color: "text-red-400",
            label: "하락 비율",
            value: `${downPct.toFixed(1)}%`,
          },
          {
            icon: "volatility",
            color: "text-yellow-300",
            label: "변동성",
            value: `${volatility.toFixed(1)}%`,
          },
        ].map(({ icon, color, label, value }) => (
          <div key={label} className="flex items-center bg-gray-700 p-2 rounded-lg">
            <Icons name={icon} className={`w-5 h-5 ${color}`} />
            <div className="ml-2">
              <p className="text-xs text-gray-300">{label}</p>
              <p className="text-lg font-semibold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Top 3 lists */}
      <div className="grid grid-cols-2 gap-4">
        <MomentumList
          title="Top 3 상승"
          items={topGainers}
          positive
          onItemClick={onMomentumClick}
        />
        <MomentumList
          title="Top 3 하락"
          items={topLosers}
          positive={false}
          onItemClick={onMomentumClick}
        />
      </div>
    </div>
  </div>
);

interface MomentumListProps {
  title: string;
  items: StockItem[];
  positive?: boolean;
  onItemClick: (id: number) => void;
}
const MomentumList: React.FC<MomentumListProps> = ({
  title,
  items,
  positive = true,
  onItemClick,
}) => (
  <div>
    <p className="text-gray-300 mb-1">{title}</p>
    <div className="space-y-2">
      {items.map((s) => (
        <div
          key={s.id}
          onClick={() => onItemClick(s.id)}
          className="bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
        >
          <p className="text-white font-medium truncate">{s.name}</p>
          <p
            className={`mt-1 text-sm font-semibold ${positive ? "text-green-400" : "text-red-400"}`}
          >
            {formatPercentage(s.priceChange)}
          </p>
        </div>
      ))}
    </div>
  </div>
);

export default MarketSidebar;
