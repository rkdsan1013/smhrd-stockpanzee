// /frontend/src/pages/Market.tsx
import React, { useState, useEffect, useMemo } from "react";
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

interface NewsSummaryItem {
  id: number;
  title: string;
  summary: string;
  stockName: string;
  symbol: string;
  category: "국내" | "해외" | "암호화폐";
  sentiment: "매우 부정" | "부정" | "중립" | "긍정" | "매우긍정";
}

// (기존에 있던) 뉴스 요약 더미 데이터
const newsSummaryData: NewsSummaryItem[] = [
  {
    id: 1,
    title: "삼성전자 신제품 발표",
    summary: "신제품 발표로 주가 상승 기대.",
    stockName: "삼성전자",
    symbol: "005930",
    category: "국내",
    sentiment: "긍정",
  },
  {
    id: 2,
    title: "현대차 실적 부진",
    summary: "실적 부진 우려 속 주가 하락.",
    stockName: "현대차",
    symbol: "005380",
    category: "국내",
    sentiment: "부정",
  },
  // …기타 데이터…
];

// (기존에 있던) 감정 배지 스타일 함수
const getSentimentBadgeStyles = (sentiment: NewsSummaryItem["sentiment"]) => {
  if (sentiment === "긍정" || sentiment === "매우긍정") return "bg-green-700 text-white";
  if (sentiment === "부정" || sentiment === "매우 부정") return "bg-red-700 text-white";
  return "bg-gray-700 text-white";
};

type SortKey = "name" | "currentPrice" | "priceChange" | "marketCap";

const Market: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"전체" | "즐겨찾기">("전체");
  const [selectedMarketTab, setSelectedMarketTab] = useState<"전체" | "국내" | "해외" | "암호화폐">(
    "전체",
  );
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "marketCap",
    direction: "desc",
  });
  const [favorites, setFavorites] = useState<number[]>([]);
  const [stockData, setStockData] = useState<StockItem[]>([]);

  // 1) 백엔드 DB에서 5초마다 갱신된 데이터 로드
  useEffect(() => {
    const load = () => {
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

    load(); // 최초 로드
    const interval = setInterval(load, 5000); // 5초마다 갱신
    return () => clearInterval(interval);
  }, []);

  // 2) 탭 필터링
  const filteredStocks = useMemo(
    () =>
      selectedMarketTab === "전체"
        ? stockData
        : stockData.filter((s) => s.category === selectedMarketTab),
    [stockData, selectedMarketTab],
  );

  // 3) 정렬
  const sortedStocks = useMemo(() => {
    const { key, direction } = sortConfig;
    const dir = direction === "asc" ? 1 : -1;
    const arr = [...filteredStocks];
    if (key === "name") {
      arr.sort((a, b) => a.name.localeCompare(b.name) * dir);
    } else {
      arr.sort((a, b) => ((a as any)[key] - (b as any)[key]) * dir);
    }
    return arr;
  }, [filteredStocks, sortConfig]);

  // 4) 즐겨찾기 모드
  const finalStocks = useMemo(
    () =>
      viewMode === "전체" ? sortedStocks : sortedStocks.filter((s) => favorites.includes(s.id)),
    [sortedStocks, viewMode, favorites],
  );

  // 5) 무한 스크롤
  const [visibleCount, setVisibleCount] = useState(10);
  useEffect(() => setVisibleCount(10), [selectedMarketTab, sortConfig, viewMode]);
  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 200) {
        setVisibleCount((v) => Math.min(v + 10, finalStocks.length));
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [finalStocks.length]);

  const visibleStocks = finalStocks.slice(0, visibleCount);

  // 6) 정렬/즐겨찾기 핸들러
  const handleSort = (key: SortKey) =>
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" },
    );
  const toggleFavorite = (id: number) =>
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const gridCols = "grid grid-cols-[40px_minmax(0,1fr)_120px_100px_120px] items-center";

  // ─────────────────────────────────────────────────────────────────────
  // 여기서부터 return(...) 바로 직전까지의 코드입니다.

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 좌측: 자산 리스트 (md:col-span-9) */}
        <div className="md:col-span-9">
          <div className="flex items-center justify-between mb-4">
            {/* 탭 */}
            <div className="flex bg-gray-800 p-1 rounded-full border border-gray-600 space-x-2">
              {(["전체", "즐겨찾기"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setViewMode(tab)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200 ${
                    viewMode === tab
                      ? "bg-white/30 text-white"
                      : "bg-transparent hover:bg-white/30 text-white"
                  }`}
                >
                  {tab === "전체" ? (
                    <Icons name="list" className="w-6 h-6" />
                  ) : (
                    <Icons name="star" className="w-6 h-6" />
                  )}
                </button>
              ))}
            </div>
            {/* 마켓 필터 */}
            <div className="flex bg-gray-800 p-1 rounded-full border border-gray-600 space-x-2">
              {(["전체", "국내", "해외", "암호화폐"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedMarketTab(tab)}
                  className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                    selectedMarketTab === tab
                      ? "bg-white/30 text-white"
                      : "bg-transparent hover:bg-white/30 text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* 헤더 (정렬 가능) */}
          <div
            className={`${gridCols} py-2 px-4 bg-gray-800 rounded-lg text-sm font-bold text-white`}
          >
            <div />
            <div onClick={() => handleSort("name")} className="cursor-pointer hover:underline">
              종목{sortConfig.key === "name" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </div>
            <div
              onClick={() => handleSort("currentPrice")}
              className="text-right cursor-pointer hover:underline"
            >
              현재가
              {sortConfig.key === "currentPrice" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </div>
            <div
              onClick={() => handleSort("priceChange")}
              className="text-right cursor-pointer hover:underline"
            >
              변동률
              {sortConfig.key === "priceChange" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </div>
            <div
              onClick={() => handleSort("marketCap")}
              className="text-right cursor-pointer hover:underline"
            >
              시가총액
              {sortConfig.key === "marketCap" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </div>
          </div>

          {/* 자산 리스트 */}
          <div className="space-y-2 mt-2">
            {visibleStocks.map((stock, idx) => (
              <div
                key={stock.id}
                className={`${gridCols} p-4 rounded-lg transition-colors duration-200 ${
                  idx % 2 === 0 ? "bg-gray-900" : "bg-gray-900/95"
                } hover:bg-gray-800 cursor-pointer`}
                onClick={() => navigate(`/asset/${stock.id}`, { state: { asset: stock } })}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(stock.id);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full focus:outline-none"
                >
                  <Icons
                    name="star"
                    className={`w-5 h-5 ${
                      favorites.includes(stock.id) ? "text-yellow-500" : "text-gray-400"
                    }`}
                  />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-white font-semibold">{stock.name}</p>
                  <p className="truncate text-gray-400 text-xs">{stock.symbol}</p>
                </div>
                {/* 현재가 */}
                <div className="text-right text-white">
                  {stock.currentPrice.toLocaleString()}{" "}
                  {stock.category === "암호화폐" ? "USDT" : "원"}
                </div>
                {/* 변동률 */}
                <div
                  className={`text-right font-semibold ${
                    stock.priceChange >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {stock.priceChange >= 0 ? "+" : ""}
                  {stock.priceChange.toFixed(2)}%
                </div>
                {/* 시가총액 */}
                <div className="text-right text-white">
                  {stock.category === "암호화폐" ? "" : formatCurrency(stock.marketCap)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 우측: 뉴스 요약 영역 */}
        <div className="md:col-span-3">
          <div className="sticky top-20 bg-gray-800 p-4 rounded-lg flex flex-col h-[80vh] transition-all duration-500 ease-in-out">
            <h2 className="text-xl font-bold text-white mb-4">뉴스 현황</h2>
            <div className="overflow-y-auto flex-1 pr-2">
              {newsSummaryData.map((news) => (
                <div
                  key={news.id}
                  className="p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 mb-3"
                >
                  <div className="flex space-x-2 mb-1">
                    <span className="inline-block px-2 py-1 text-xs font-bold rounded-full bg-gray-700 text-white">
                      {news.category}
                    </span>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${getSentimentBadgeStyles(
                        news.sentiment,
                      )}`}
                    >
                      {news.sentiment}
                    </span>
                  </div>
                  <p className="text-sm text-white font-semibold">
                    {news.stockName} <span className="text-sm text-gray-400">{news.symbol}</span>
                  </p>
                  <h3 className="text-base font-bold text-white">{news.title}</h3>
                  <p className="text-sm text-gray-400">{news.summary}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="bg-white/30 hover:bg-white/50 p-3 rounded-full"
              >
                <Icons name="chevronDoubleUp" className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Market;
