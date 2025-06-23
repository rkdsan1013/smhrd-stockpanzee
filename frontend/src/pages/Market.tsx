// /frontend/src/pages/Market.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icons from "../components/Icons";
import { fetchAssets } from "../services/assetService";
import type { Asset } from "../services/assetService";

// 숫자 단위 포맷 함수
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

  // 탭 & 뷰 모드
  const [selectedMarketTab, setSelectedMarketTab] = useState<"전체" | "국내" | "해외" | "암호화폐">(
    "전체",
  );
  const [viewMode, setViewMode] = useState<"전체" | "즐겨찾기">("전체");

  // 데이터 & 상태
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "marketCap",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // 데이터 로드 & 5초 주기 갱신
  useEffect(() => {
    const load = () => {
      fetchAssets()
        .then((assets: Asset[]) => {
          const list: StockItem[] = assets.map((a) => {
            let category: StockItem["category"];
            if (a.market === "KOSPI" || a.market === "KOSDAQ") category = "국내";
            else if (a.market === "NASDAQ" || a.market === "NYSE") category = "해외";
            else if (a.market === "Binance") category = "암호화폐";
            else category = "기타";

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
          setStockData(list);
        })
        .catch(console.error);
    };

    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  // 탭/정렬/뷰 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMarketTab, viewMode, sortConfig]);

  // 1) 탭 필터링
  const filtered = useMemo(
    () =>
      selectedMarketTab === "전체"
        ? stockData
        : stockData.filter((s) => s.category === selectedMarketTab),
    [stockData, selectedMarketTab],
  );

  // 2) 정렬
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const { key, direction } = sortConfig;
    const factor = direction === "asc" ? 1 : -1;
    if (key === "name") {
      arr.sort((a, b) => a.name.localeCompare(b.name) * factor);
    } else {
      arr.sort((a, b) => ((a as any)[key] - (b as any)[key]) * factor);
    }
    return arr;
  }, [filtered, sortConfig]);

  // 3) 즐겨찾기 우선 / 즐겨찾기만 표시
  const finalList = useMemo(() => {
    if (viewMode === "전체") {
      return [...sorted].sort((a, b) => {
        const af = favorites.includes(a.id) ? 0 : 1;
        const bf = favorites.includes(b.id) ? 0 : 1;
        return af - bf;
      });
    }
    return sorted.filter((s) => favorites.includes(s.id));
  }, [sorted, viewMode, favorites]);

  // 4) 페이지네이션 (무한 스크롤)
  const visible = useMemo(
    () => finalList.slice(0, currentPage * itemsPerPage),
    [finalList, currentPage],
  );

  // 시장 현황 통계
  const risingCount = finalList.filter((s) => s.priceChange > 0).length;
  const fallingCount = finalList.filter((s) => s.priceChange < 0).length;
  const unchangedCount = finalList.filter((s) => s.priceChange === 0).length;
  const totalCount = finalList.length;
  const avgPrice = totalCount
    ? Math.round(finalList.reduce((sum, s) => sum + s.currentPrice, 0) / totalCount)
    : 0;
  const totalMarketCap = finalList.reduce((sum, s) => sum + s.marketCap, 0);

  // 무한 스크롤 옵저버
  const loadMoreRef = useRef<HTMLDivElement>(null);
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
    };
  }, [visible, finalList]);

  // 즐겨찾기 토글
  const toggleFavorite = (id: number) =>
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // 정렬 토글
  const handleSort = (key: SortKey) =>
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" },
    );

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="py-4">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white text-3xl font-bold">자산 마켓</h1>
        </div>
      </header>

      <section className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 탭 */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex space-x-4 bg-gray-800 p-2 rounded-full">
            {(["전체", "국내", "해외", "암호화폐"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedMarketTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 focus:outline-none ${
                  selectedMarketTab === tab
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-blue-500 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex space-x-4 bg-gray-800 p-2 rounded-full">
            {(["전체", "즐겨찾기"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300 focus:outline-none ${
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

        <div className="flex flex-col md:flex-row gap-6">
          {/* 좌측 리스트 */}
          <div className="w-full md:w-2/3">
            {/* 헤더 */}
            <div className="flex items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
              <div className="w-8" />
              <div className="flex-1">
                <button
                  onClick={() => handleSort("name")}
                  className="w-full text-left focus:outline-none active:scale-95 transition-transform duration-200"
                >
                  <span className="text-white font-semibold">
                    종목 {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </span>
                </button>
              </div>
              <div className="w-40 text-right whitespace-nowrap">
                <button
                  onClick={() => handleSort("currentPrice")}
                  className="w-full text-right focus:outline-none active:scale-95 transition-transform duration-200"
                >
                  <span className="text-white font-semibold">
                    현재가{" "}
                    {sortConfig.key === "currentPrice" &&
                      (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </span>
                </button>
              </div>
              <div className="w-20 text-right">
                <button
                  onClick={() => handleSort("priceChange")}
                  className="w-full text-right focus:outline-none active:scale-95 transition-transform duration-200"
                >
                  <span className="text-white font-semibold">
                    변동률{" "}
                    {sortConfig.key === "priceChange" &&
                      (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </span>
                </button>
              </div>
              <div className="w-32 text-right whitespace-nowrap">
                <button
                  onClick={() => handleSort("marketCap")}
                  className="w-full text-right focus:outline-none active:scale-95 transition-transform duration-200"
                >
                  <span className="text-white font-semibold">
                    시가총액{" "}
                    {sortConfig.key === "marketCap" && (sortConfig.direction === "asc" ? "▲" : "▼")}
                  </span>
                </button>
              </div>
            </div>

            {/* 데이터 로우 */}
            {visible.map((stock) => (
              <div
                key={stock.id}
                className="flex items-center px-4 py-2 border-b border-gray-700 hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => navigate(`/asset/${stock.id}`, { state: { asset: stock } })}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(stock.id);
                  }}
                  className="w-8 flex justify-center focus:outline-none"
                >
                  <Icons
                    name="star"
                    className={`w-5 h-5 ${
                      favorites.includes(stock.id) ? "text-yellow-500" : "text-gray-400"
                    }`}
                  />
                </button>
                <div className="flex-1">
                  <p className="text-white font-semibold">{stock.name}</p>
                  <p className="text-gray-400 text-xs">{stock.symbol}</p>
                </div>
                <div className="w-40 text-right whitespace-nowrap text-white">
                  {stock.currentPrice.toLocaleString()}{" "}
                  {stock.category === "암호화폐" ? "USDT" : "원"}
                </div>
                <div
                  className={`w-20 text-right font-semibold ${
                    stock.priceChange >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {stock.priceChange >= 0 ? "+" : ""}
                  {stock.priceChange.toFixed(2)}%
                </div>
                <div className="w-32 text-right whitespace-nowrap text-white">
                  {formatCurrency(stock.marketCap)}
                </div>
              </div>
            ))}
            {visible.length < finalList.length && <div ref={loadMoreRef} className="h-4" />}
          </div>

          {/* 우측 시장 현황 */}
          <div className="w-full md:w-1/3">
            <div className="sticky top-28">
              <div className="bg-gray-800 rounded-lg shadow p-4">
                <h2 className="text-lg font-bold text-white text-center mb-3">시장 현황</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">상승 종목</span>
                    <span className="text-green-500 font-semibold">{risingCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">하락 종목</span>
                    <span className="text-red-500 font-semibold">{fallingCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">변동 없음</span>
                    <span className="text-white font-semibold">{unchangedCount}</span>
                  </div>
                  <hr className="border-gray-700" />
                  <div className="flex justify-between">
                    <span className="text-gray-300">총 종목 수</span>
                    <span className="text-white font-semibold">{totalCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">평균 현재가</span>
                    <span className="text-white font-semibold">{avgPrice.toLocaleString()} 원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">전체 시가총액</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(totalMarketCap)}
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
