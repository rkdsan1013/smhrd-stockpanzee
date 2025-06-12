// /frontend/src/pages/Market.tsx
import React, { useState, useEffect, useMemo } from "react";
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
  // …추가 데이터…
];

const getSentimentBadgeStyles = (
  sentiment: StockItem["category"] | NewsSummaryItem["sentiment"],
) => {
  if (sentiment === "긍정" || sentiment === "매우긍정") return "bg-green-700 text-white";
  if (sentiment === "부정" || sentiment === "매우 부정") return "bg-red-700 text-white";
  return "bg-gray-700 text-white";
};

type SortKey = "name" | "currentPrice" | "priceChange" | "marketCap";

const Market: React.FC = () => {
  // 탭, 정렬, 즐겨찾기 상태
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

  // API에서 자산 로드 후 category 계산
  useEffect(() => {
    fetchAssets()
      .then((assets: Asset[]) => {
        const list: StockItem[] = assets.map((a) => {
          let category: StockItem["category"];
          if (a.market === "KOSPI" || a.market === "KOSDAQ") category = "국내";
          else if (a.market === "NASDAQ" || a.market === "NYSE") category = "해외";
          else if (a.market === "Binance") category = "암호화폐";
          else category = "국내";
          return {
            id: a.id,
            name: a.name,
            symbol: a.symbol,
            currentPrice: 0,
            priceChange: 0,
            marketCap: 0,
            logo: "/panzee.webp",
            category,
          };
        });
        setStockData(list);
      })
      .catch(console.error);
  }, []);

  // Market 탭 필터링
  const filteredStocks = useMemo(
    () =>
      selectedMarketTab === "전체"
        ? stockData
        : stockData.filter((s) => s.category === selectedMarketTab),
    [stockData, selectedMarketTab],
  );

  // 정렬
  const sortedStocks = useMemo(() => {
    const { key, direction } = sortConfig;
    const dir = direction === "asc" ? 1 : -1;
    const arr = [...filteredStocks];
    if (key === "name") arr.sort((a, b) => a.name.localeCompare(b.name) * dir);
    else arr.sort((a, b) => (a[key] - b[key]) * dir);
    return arr;
  }, [filteredStocks, sortConfig]);

  // 즐겨찾기 모드 적용
  const finalStocks = useMemo(
    () =>
      viewMode === "전체" ? sortedStocks : sortedStocks.filter((s) => favorites.includes(s.id)),
    [sortedStocks, viewMode, favorites],
  );

  // 무한 스크롤: 초기 10개, 스크롤 하단에서 200px 남으면 10개씩 추가
  const [visibleCount, setVisibleCount] = useState(10);
  useEffect(() => {
    setVisibleCount(10);
  }, [selectedMarketTab, sortConfig, viewMode]);
  useEffect(() => {
    const THRESHOLD = 200;
    const onScroll = () => {
      const scrollBottom = window.innerHeight + window.scrollY;
      const pageHeight = document.documentElement.scrollHeight;
      if (scrollBottom >= pageHeight - THRESHOLD && visibleCount < finalStocks.length) {
        setVisibleCount((v) => Math.min(v + 10, finalStocks.length));
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [visibleCount, finalStocks]);
  const visibleStocks = finalStocks.slice(0, visibleCount);

  const handleSort = (key: SortKey) =>
    setSortConfig((p) =>
      p.key === key
        ? { key, direction: p.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" },
    );

  const toggleFavorite = (id: number) =>
    setFavorites((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  // 고정 컬럼 레이아웃: 즐겨찾기 40px, 종목 영역(minmax(0,1fr)), 현재가 120px, 변동률 100px, 시가총액 120px
  const gridCols = "grid grid-cols-[40px_minmax(0,1fr)_120px_100px_120px] items-center";

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 좌측: 자산 리스트 (md:col-span-9) */}
        <div className="md:col-span-9">
          <div className="flex items-center justify-between mb-4">
            {/* 원형 전체/즐겨찾기 탭 */}
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
            {/* 타원형 마켓 필터 탭 */}
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
              종목
              {sortConfig.key === "name" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
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
                } hover:bg-gray-800`}
              >
                <button
                  onClick={() => toggleFavorite(stock.id)}
                  className="w-10 h-10 flex items-center justify-center rounded-full focus:outline-none"
                >
                  <Icons
                    name="star"
                    className={`w-5 h-5 ${favorites.includes(stock.id) ? "text-yellow-500" : "text-gray-400"}`}
                  />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-white font-semibold">{stock.name}</p>
                  <p className="truncate text-gray-400 text-xs">{stock.symbol}</p>
                </div>
                <div className="text-right text-white">
                  {stock.currentPrice.toLocaleString()} 원
                </div>
                <div
                  className={`text-right font-semibold ${stock.priceChange >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {stock.priceChange >= 0 ? "+" : ""}
                  {stock.priceChange.toFixed(2)}%
                </div>
                <div className="text-right text-white">{formatCurrency(stock.marketCap)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 우측: 뉴스 요약 영역 (md:col-span-3) - 스크롤 버튼은 이 컨테이너 내부에 배치 */}
        <div className="md:col-span-3">
          <div className="sticky top-20 bg-gray-800 p-4 rounded-lg transition-all duration-500 ease-in-out flex flex-col h-[80vh]">
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
                      className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${getSentimentBadgeStyles(news.sentiment)}`}
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
            {/* 페이지 최상단 이동 버튼 (뉴스 영역 내부, sticky 컨테이너 하단) */}
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
