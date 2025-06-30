// frontend/src/pages/Market.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icons from "../components/Icons";
import Tooltip from "../components/Tooltip";
import { fetchAssets } from "../services/assetService";
import type { Asset } from "../services/assetService";
import { fuzzySearch } from "../utils/search";
import { formatCurrency } from "../utils/formats";

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

const BIG_CHANGE_THRESHOLD = 5;
const itemsPerPage = 12;

const Market: React.FC = () => {
  const navigate = useNavigate();

  // -- State
  const [selectedMarketTab, setSelectedMarketTab] = useState<StockItem["category"] | "전체">(
    "전체",
  );
  const [viewMode, setViewMode] = useState<"전체" | "즐겨찾기">("전체");
  const [searchTerm, setSearchTerm] = useState("");
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "marketCap",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);

  // -- Refs for highlight
  const previousPricesRef = useRef<Map<number, number>>(new Map());
  const highlightMapRef = useRef<Map<number, "up" | "down">>(new Map());
  const [, forceUpdate] = useState(0);

  // 1) Fetch & Highlight
  useEffect(() => {
    const load = () =>
      fetchAssets()
        .then((assets: Asset[]) => {
          const list: StockItem[] = assets.map((a) => ({
            id: a.id,
            name: a.name,
            symbol: a.symbol,
            currentPrice: a.currentPrice,
            priceChange: a.priceChange,
            marketCap: a.marketCap,
            logo: "/panzee.webp",
            category: ["KOSPI", "KOSDAQ"].includes(a.market)
              ? "국내"
              : ["NASDAQ", "NYSE"].includes(a.market)
                ? "해외"
                : a.market === "Binance"
                  ? "암호화폐"
                  : "기타",
          }));

          list.forEach((s) => {
            const prev = previousPricesRef.current.get(s.id);
            if (prev !== undefined && prev !== s.currentPrice) {
              highlightMapRef.current.set(s.id, s.currentPrice > prev ? "up" : "down");
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

    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMarketTab, viewMode, sortConfig, searchTerm]);

  // 2) Filter by tab
  const filteredByTab = useMemo(
    () =>
      selectedMarketTab === "전체"
        ? stockData
        : stockData.filter((s) => s.category === selectedMarketTab),
    [stockData, selectedMarketTab],
  );

  // 3) Apply view mode
  const filteredByView = useMemo(() => {
    if (viewMode === "즐겨찾기") {
      return filteredByTab.filter((s) => favorites.includes(s.id));
    }
    return [...filteredByTab].sort((a, b) =>
      favorites.includes(a.id) === favorites.includes(b.id) ? 0 : favorites.includes(a.id) ? -1 : 1,
    );
  }, [filteredByTab, viewMode, favorites]);

  // 4) Sort unless searching
  const sorted = useMemo(() => {
    if (searchTerm.trim()) return filteredByView;
    const factor = sortConfig.direction === "asc" ? 1 : -1;
    return [...filteredByView].sort((a, b) =>
      sortConfig.key === "name"
        ? a.name.localeCompare(b.name) * factor
        : ((a as any)[sortConfig.key] - (b as any)[sortConfig.key]) * factor,
    );
  }, [filteredByView, sortConfig, searchTerm]);

  // 5) Fuzzy search
  const searched = useMemo(() => {
    if (!searchTerm.trim()) return sorted;
    return fuzzySearch(sorted, searchTerm, {
      keys: ["name", "symbol"],
      threshold: 0.3,
    });
  }, [sorted, searchTerm]);

  // 6) Pagination & Infinite Scroll
  const finalList = searched;
  const visible = finalList.slice(0, currentPage * itemsPerPage);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visible.length < finalList.length) {
          setCurrentPage((p) => p + 1);
        }
      },
      { threshold: 1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible.length, finalList.length]);

  // Handlers
  const toggleFavorite = (id: number) =>
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const handleSort = (key: SortKey) => {
    if (searchTerm.trim()) return;
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" },
    );
  };
  const toggleViewMode = () => setViewMode((m) => (m === "전체" ? "즐겨찾기" : "전체"));

  // 7) Summary (tab-based)
  const summaryList = filteredByTab;
  const summaryTotal = summaryList.length;
  const summaryFallingLarge = summaryList.filter(
    (s) => s.priceChange < -BIG_CHANGE_THRESHOLD,
  ).length;
  const summaryFallingSmall = summaryList.filter(
    (s) => s.priceChange < 0 && s.priceChange >= -BIG_CHANGE_THRESHOLD,
  ).length;
  const summaryUnchanged = summaryList.filter((s) => s.priceChange === 0).length;
  const summaryRisingSmall = summaryList.filter(
    (s) => s.priceChange > 0 && s.priceChange <= BIG_CHANGE_THRESHOLD,
  ).length;
  const summaryRisingLarge = summaryList.filter((s) => s.priceChange > BIG_CHANGE_THRESHOLD).length;
  const summaryAvgPrice = summaryTotal
    ? Math.round(summaryList.reduce((sum, s) => sum + s.currentPrice, 0) / summaryTotal)
    : 0;
  const summaryMarketCap = summaryList.reduce((sum, s) => sum + s.marketCap, 0);

  const headerCols = [
    { key: "name", label: "종목", width: "flex-1 text-left" },
    { key: "currentPrice", label: "현재가", width: "w-28 text-right" },
    { key: "priceChange", label: "변동률", width: "w-20 text-right" },
    { key: "marketCap", label: "시가총액", width: "w-36 text-right" },
  ] as const;
  const statusTitle = `${selectedMarketTab} 시장 현황`;

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="py-4">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white text-3xl font-bold">자산 마켓</h1>
        </div>
      </header>

      <section className="container mx-auto px-4 py-6 max-w-7xl space-y-4">
        {/* 네비탭: 뷰모드 토글 + 시장선택 */}
        <div className="flex items-center bg-gray-800 p-2 rounded-full w-full space-x-2">
          <button onClick={toggleViewMode} className="p-2 rounded-full">
            <Icons
              name="banana"
              className={`w-5 h-5 ${viewMode === "즐겨찾기" ? "text-yellow-400" : "text-gray-500"}`}
            />
          </button>
          {(["전체", "국내", "해외", "암호화폐"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedMarketTab(tab === "전체" ? "전체" : tab)}
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

        <div className="flex flex-col md:flex-row gap-4">
          {/* 좌측 리스트 */}
          <div className="w-full md:w-2/3 space-y-2">
            {/* 테이블 헤더 */}
            <div className="flex items-center px-4 py-2 bg-gray-800 rounded-lg">
              <div className="w-8" />
              {headerCols.map((col) => (
                <div key={col.key} className={col.width}>
                  <button
                    onClick={() => handleSort(col.key)}
                    className={`flex items-center gap-1 ${
                      col.key === "name" ? "justify-start" : "justify-end"
                    } w-full text-white font-semibold`}
                  >
                    <span>{col.label}</span>
                    <Icons
                      name={
                        sortConfig.key === col.key
                          ? sortConfig.direction === "asc"
                            ? "caretUp"
                            : "caretDown"
                          : "caretDown"
                      }
                      className={`w-4 h-4 ${
                        sortConfig.key === col.key ? "text-white" : "text-transparent"
                      }`}
                    />
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
                  className={`
                    flex items-center px-4 py-2 rounded-lg border ${borderClass}
                    transition-all duration-500 cursor-pointer
                    hover:bg-gray-700 hover:scale-[1.005]
                  `}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(s.id);
                    }}
                    className="w-8 h-8 flex items-center justify-center"
                  >
                    <Icons
                      name="banana"
                      className={`w-5 h-5 ${
                        favorites.includes(s.id) ? "text-yellow-400" : "text-gray-500"
                      }`}
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
                    className={`w-20 text-right font-semibold ml-2 ${
                      s.priceChange >= 0 ? "text-green-400" : "text-red-400"
                    }`}
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

          {/* 우측: 검색창 + 요약 (둘 다 sticky) */}
          <div className="w-full md:w-1/3">
            <div className="sticky top-20 space-y-4">
              <input
                type="text"
                placeholder="종목명 또는 심볼로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none"
              />

              <div className="bg-gray-800 rounded-lg shadow p-6 space-y-4">
                <h2 className="text-lg font-bold text-white text-center">{statusTitle}</h2>
                <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden flex">
                  {[
                    {
                      count: summaryFallingLarge,
                      color: "bg-red-700",
                      label: `큰 하락: ${summaryFallingLarge}건`,
                    },
                    {
                      count: summaryFallingSmall,
                      color: "bg-red-400",
                      label: `하락: ${summaryFallingSmall}건`,
                    },
                    {
                      count: summaryUnchanged,
                      color: "bg-gray-500",
                      label: `변동 없음: ${summaryUnchanged}건`,
                    },
                    {
                      count: summaryRisingSmall,
                      color: "bg-green-400",
                      label: `상승: ${summaryRisingSmall}건`,
                    },
                    {
                      count: summaryRisingLarge,
                      color: "bg-green-700",
                      label: `큰 상승: ${summaryRisingLarge}건`,
                    },
                  ].map(({ count, color, label }) => {
                    const pct = summaryTotal ? (count / summaryTotal) * 100 : 0;
                    return (
                      <Tooltip key={label} label={label} style={{ width: `${pct}%` }}>
                        <div className={`${color} w-full h-full`} />
                      </Tooltip>
                    );
                  })}
                </div>

                <div className="grid grid-cols-5 text-xs text-gray-300">
                  <div className="flex items-center justify-center space-x-1">
                    <span className="w-2 h-2 bg-red-700 rounded-full" />
                    <span>큰 하락</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    <span className="w-2 h-2 bg-red-400 rounded-full" />
                    <span>하락</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    <span className="w-2 h-2 bg-gray-500 rounded-full" />
                    <span>변동 없음</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    <span>상승</span>
                  </div>
                  <div className="flex items-center justify-center space-x-1">
                    <span className="w-2 h-2 bg-green-700 rounded-full" />
                    <span>큰 상승</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-gray-400">
                    <span>총 종목 수</span>
                    <span className="text-gray-200 font-semibold">{summaryTotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>평균 현재가</span>
                    <span className="text-gray-200 font-semibold">
                      {summaryAvgPrice.toLocaleString()} 원
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>전체 시가총액</span>
                    <span className="text-gray-200 font-semibold">
                      {formatCurrency(summaryMarketCap)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Market;
