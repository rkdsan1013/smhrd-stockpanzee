// /frontend/src/pages/Market.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icons from "../components/Icons";
import { fetchAssets } from "../services/assetService";
import type { Asset } from "../services/assetService";

const formatCurrency = (value: number): string => {
  if (value >= 1e12) return (value / 1e12).toFixed(1) + "조";
  if (value >= 1e8) return (value / 1e8).toFixed(1) + "억";
  if (value >= 1e4) return (value / 1e4).toFixed(1) + "만";
  return value.toLocaleString() + "원";
};

interface StockItem {
  id: number;
  name: string;
  symbol: string;
  currentPrice: number;
  priceChange: number;
  marketCap: number;
  logo: string;
  category: "국내" | "해외" | "암호화폐" | "기타";
}

type SortKey = "name" | "currentPrice" | "priceChange" | "marketCap";

const Market: React.FC = () => {
  const navigate = useNavigate();
  const [selectedMarketTab, setSelectedMarketTab] = useState<StockItem["category"] | "전체">(
    "전체",
  );
  const [viewMode, setViewMode] = useState<"전체" | "즐겨찾기">("전체");
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "marketCap",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const previousPricesRef = useRef<Map<number, number>>(new Map());
  const highlightMapRef = useRef<Map<number, "up" | "down">>(new Map());
  const [, forceUpdate] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => {
      fetchAssets()
        .then((assets: Asset[]) => {
          const list: StockItem[] = assets.map((a) => {
            const category = (
              ["KOSPI", "KOSDAQ"].includes(a.market)
                ? "국내"
                : ["NASDAQ", "NYSE"].includes(a.market)
                  ? "해외"
                  : a.market === "Binance"
                    ? "암호화폐"
                    : "기타"
            ) as StockItem["category"];

            return {
              id: a.id,
              name: a.name,
              symbol: a.symbol,
              currentPrice: a.currentPrice,
              priceChange: a.priceChange,
              marketCap: a.marketCap,
              logo: "/panzee.webp",
              category,
            };
          });

          list.forEach((s) => {
            const prev = previousPricesRef.current.get(s.id);
            if (prev !== undefined && prev !== s.currentPrice) {
              const dir = s.currentPrice > prev ? "up" : "down";
              highlightMapRef.current.set(s.id, dir);
              setTimeout(() => {
                highlightMapRef.current.delete(s.id);
                forceUpdate((v) => v + 1);
              }, 500);
            }
            previousPricesRef.current.set(s.id, s.currentPrice);
          });

          setStockData(list);
        })
        .catch(console.error);
    };

    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMarketTab, viewMode, sortConfig]);

  const filtered = useMemo(
    () =>
      selectedMarketTab === "전체"
        ? stockData
        : stockData.filter((s) => s.category === selectedMarketTab),
    [stockData, selectedMarketTab],
  );

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { key, direction } = sortConfig;
    const factor = direction === "asc" ? 1 : -1;
    arr.sort((a, b) =>
      key === "name"
        ? a.name.localeCompare(b.name) * factor
        : ((a as any)[key] - (b as any)[key]) * factor,
    );
    return arr;
  }, [filtered, sortConfig]);

  const finalList = useMemo(() => {
    if (viewMode === "전체") {
      return [...sorted].sort((a, b) =>
        favorites.includes(a.id) === favorites.includes(b.id)
          ? 0
          : favorites.includes(a.id)
            ? -1
            : 1,
      );
    }
    return sorted.filter((s) => favorites.includes(s.id));
  }, [sorted, viewMode, favorites]);

  const visible = useMemo(
    () => finalList.slice(0, currentPage * itemsPerPage),
    [finalList, currentPage],
  );

  const risingCount = finalList.filter((s) => s.priceChange > 0).length;
  const fallingCount = finalList.filter((s) => s.priceChange < 0).length;
  const unchangedCount = finalList.filter((s) => s.priceChange === 0).length;
  const totalCount = finalList.length;
  const avgPrice = totalCount
    ? Math.round(finalList.reduce((sum, s) => sum + s.currentPrice, 0) / totalCount)
    : 0;
  const totalMarketCap = finalList.reduce((sum, s) => sum + s.marketCap, 0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visible.length < finalList.length) {
          setCurrentPage((p) => p + 1);
        }
      },
      { threshold: 1 },
    );
    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    }; // ✅ cleanup without null return
  }, [visible, finalList]);

  const toggleFavorite = (id: number) => {
    setFavorites((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  };

  const handleSort = (key: SortKey) => {
    setSortConfig((p) =>
      p.key === key
        ? { key, direction: p.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" },
    );
  };

  const headerCols = [
    { key: "name", label: "종목", width: "flex-1 text-left" },
    { key: "currentPrice", label: "현재가", width: "w-28 text-right" },
    { key: "priceChange", label: "변동률", width: "w-20 text-right" },
    { key: "marketCap", label: "시가총액", width: "w-36 text-right" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="py-4">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white text-3xl font-bold">자산 마켓</h1>
        </div>
      </header>

      <section className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-wrap justify-between gap-4 mb-4">
          <div className="flex space-x-2 bg-gray-800 p-2 rounded-full">
            {(["전체", "국내", "해외", "암호화폐"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() =>
                  setSelectedMarketTab(tab === "전체" ? "전체" : (tab as StockItem["category"]))
                }
                className={`px-4 py-1 rounded-full text-sm font-medium transition-colors duration-300 ${
                  selectedMarketTab === tab
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-blue-500 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex space-x-2 bg-gray-800 p-2 rounded-full">
            {(["전체", "즐겨찾기"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1 rounded-full text-sm font-medium transition-colors duration-300 ${
                  viewMode === mode
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-blue-500 hover:text-white"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-2/3 space-y-2">
            <div className="flex items-center px-4 py-2 bg-gray-800 rounded-lg">
              <div className="w-8" />
              {headerCols.map((col) => (
                <div key={col.key} className={col.width}>
                  <button onClick={() => handleSort(col.key)}>
                    <span className="text-white font-semibold">
                      {col.label}
                      {sortConfig.key === col.key && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            {visible.map((s) => {
              const hl = highlightMapRef.current.get(s.id);
              const borderClass =
                hl === "up"
                  ? "border-green-400"
                  : hl === "down"
                    ? "border-red-400"
                    : "border-transparent";
              return (
                <div
                  key={s.id}
                  onClick={() => navigate(`/asset/${s.id}`, { state: { asset: s } })}
                  className={`flex items-center px-4 py-2 rounded-lg border-2 transition-all duration-500 cursor-pointer hover:bg-gray-700 hover:scale-[1.005] ${borderClass}`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(s.id);
                    }}
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    <Icons
                      name="star"
                      className={`w-5 h-5 ${favorites.includes(s.id) ? "text-yellow-400" : "text-gray-500"}`}
                    />
                  </button>
                  <div className="flex-1 ml-2">
                    <p className="text-white font-semibold">{s.name}</p>
                    <p className="text-gray-400 text-xs">{s.symbol}</p>
                  </div>
                  <div className="w-28 text-right text-white font-medium">
                    {s.currentPrice.toLocaleString()} 원
                  </div>
                  <div
                    className={`w-20 text-right font-semibold ml-2 ${s.priceChange >= 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {s.priceChange >= 0 ? "+" : ""}
                    {s.priceChange.toFixed(2)}%
                  </div>
                  <div className="w-36 text-right text-gray-200 ml-2">
                    {formatCurrency(s.marketCap)}
                  </div>
                </div>
              );
            })}
            {visible.length < finalList.length && <div ref={loadMoreRef} className="h-2" />}
          </div>

          <div className="w-full md:w-1/3">
            <div className="sticky top-20 bg-gray-800 rounded-lg shadow p-4 space-y-2">
              <h2 className="text-lg font-bold text-white text-center">시장 현황</h2>
              {[
                { label: "상승 종목", value: risingCount, color: "text-green-400" },
                { label: "하락 종목", value: fallingCount, color: "text-red-400" },
                { label: "변동 없음", value: unchangedCount, color: "text-gray-200" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-400">{label}</span>
                  <span className={`${color} font-semibold`}>{value}</span>
                </div>
              ))}
              <hr className="border-gray-700" />
              <div className="flex justify-between">
                <span className="text-gray-400">총 종목 수</span>
                <span className="text-gray-200 font-semibold">{totalCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">평균 현재가</span>
                <span className="text-gray-200 font-semibold">{avgPrice.toLocaleString()} 원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">전체 시가총액</span>
                <span className="text-gray-200 font-semibold">
                  {formatCurrency(totalMarketCap)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Market;
