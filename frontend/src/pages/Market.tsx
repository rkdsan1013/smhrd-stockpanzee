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
  category: "국내" | "해외" | "암호화폐";
}

type SortKey = "name" | "currentPrice" | "priceChange" | "marketCap";

const Market: React.FC = () => {
  const navigate = useNavigate();

  // 네비게이션 탭: 시장 필터와 뷰 모드 (정렬은 테이블 헤더에서 처리)
  const [selectedMarketTab, setSelectedMarketTab] = useState<"전체" | "국내" | "해외" | "암호화폐">(
    "전체",
  );
  const [viewMode, setViewMode] = useState<"전체" | "즐겨찾기">("전체");

  // 자산 데이터, 즐겨찾기, 정렬 및 페이지네이션 상태
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "marketCap",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  // 백엔드에서 5초마다 자산 데이터를 업데이트
  useEffect(() => {
    const loadAssets = () => {
      fetchAssets()
        .then((assets: Asset[]) => {
          const list: StockItem[] = assets.map((a) => {
            let category: StockItem["category"];
            const m = a.market.toUpperCase();
            if (m === "KOSPI" || m === "KOSDAQ") category = "국내";
            else if (m === "NASDAQ" || m === "NYSE") category = "해외";
            else category = "암호화폐";
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
    loadAssets();
    const intervalId = setInterval(loadAssets, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // 필터(시장 탭, 뷰 모드, 정렬) 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMarketTab, viewMode, sortConfig]);

  // 1. 시장 필터 적용
  const filteredStocks = useMemo(() => {
    return selectedMarketTab === "전체"
      ? stockData
      : stockData.filter((stock) => stock.category === selectedMarketTab);
  }, [stockData, selectedMarketTab]);

  // 2. 정렬 적용 (종목, 현재가, 변동률, 시가총액)
  const sortedStocks = useMemo(() => {
    const sorted = [...filteredStocks];
    const { key, direction } = sortConfig;
    const factor = direction === "asc" ? 1 : -1;
    if (key === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name) * factor);
    } else {
      sorted.sort((a, b) => ((a as any)[key] - (b as any)[key]) * factor);
    }
    return sorted;
  }, [filteredStocks, sortConfig]);

  // 3. "전체" 모드에서는 즐겨찾기 된 자산을 최상단에 배치
  const finalStocks = useMemo(() => {
    if (viewMode === "전체") {
      const withFavorites = [...sortedStocks].sort((a, b) => {
        const aFav = favorites.includes(a.id) ? 0 : 1;
        const bFav = favorites.includes(b.id) ? 0 : 1;
        return aFav - bFav;
      });
      return withFavorites;
    } else {
      return sortedStocks.filter((stock) => favorites.includes(stock.id));
    }
  }, [sortedStocks, viewMode, favorites]);

  // 4. 페이지네이션 처리
  const visibleStocks = useMemo(() => {
    return finalStocks.slice(0, currentPage * itemsPerPage);
  }, [finalStocks, currentPage]);

  // 5. 무한 스크롤 구현 (Intersection Observer)
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && visibleStocks.length < finalStocks.length) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 1 },
    );
    const currentElem = loadMoreRef.current;
    if (currentElem) observer.observe(currentElem);
    return () => {
      if (currentElem) observer.unobserve(currentElem);
    };
  }, [visibleStocks, finalStocks]);

  // 즐겨찾기 토글 함수
  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // 테이블 컬럼에서 정렬 버튼 토글 함수 (클릭 시 active:scale-95 효과 포함)
  const handleSort = (key: SortKey) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" },
    );
  };

  // 시장 현황 통계 계산
  const risingCount = finalStocks.filter((stock) => stock.priceChange > 0).length;
  const fallingCount = finalStocks.filter((stock) => stock.priceChange < 0).length;
  const unchangedCount = finalStocks.filter((stock) => stock.priceChange === 0).length;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* 헤더 (배경 제거) */}
      <header className="py-4">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white text-3xl font-bold">자산 마켓</h1>
        </div>
      </header>

      {/* 콘텐츠 영역 (뉴스페이지와 일관된 좌우 여백 적용) */}
      <section className="container mx-auto px-4 py-8">
        {/* 네비게이션: 시장 필터 탭 & 뷰 모드 탭 */}
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

        {/* 메인 컨텐츠: 좌측 자산 리스트 & 우측 시장 현황 */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* 좌측: 자산 리스트 (테이블 형식) */}
          <div className="w-full md:w-2/3">
            {/* 리스트 헤더 (테이블 컬럼 - 각 버튼에 active:scale-95 효과 적용) */}
            <div className="flex items-center px-4 py-2 bg-gray-800 rounded-lg">
              <div className="w-8"></div>
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
              <div className="w-28 text-right">
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
              <div className="w-32 text-right">
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
            {/* 자산 한 줄 리스트 */}
            {visibleStocks.map((stock) => (
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
                    className={`w-5 h-5 ${favorites.includes(stock.id) ? "text-yellow-500" : "text-gray-400"}`}
                  />
                </button>
                <div className="flex-1">
                  <p className="text-white font-semibold">{stock.name}</p>
                  <p className="text-gray-400 text-xs">{stock.symbol}</p>
                </div>
                <div className="w-28 text-right text-white">
                  {stock.currentPrice.toLocaleString()}{" "}
                  {stock.category === "암호화폐" ? "USDT" : "원"}
                </div>
                <div
                  className={`w-20 text-right font-semibold ${stock.priceChange >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {stock.priceChange >= 0 ? "+" : ""}
                  {stock.priceChange.toFixed(2)}%
                </div>
                <div className="w-32 text-right text-white">
                  {stock.category !== "암호화폐" ? formatCurrency(stock.marketCap) : ""}
                </div>
              </div>
            ))}
            {/* 무한 스크롤 감지용 sentinel */}
            {visibleStocks.length < finalStocks.length && <div ref={loadMoreRef} className="h-4" />}
          </div>

          {/* 우측: 시장 현황 패널 */}
          <div className="w-full md:w-1/3">
            <div className="bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-white text-center mb-4">시장 현황</h2>
              <div className="space-y-3">
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
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Market;
