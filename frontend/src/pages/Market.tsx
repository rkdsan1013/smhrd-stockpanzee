// /frontend/src/pages/Market.tsx
import React, { useState, useEffect, useMemo } from "react";
import Icons from "../components/Icons";

// 숫자 단위 포맷 함수 (현재가는 원래 숫자 그대로, 시가총액만 단위 축소)
const formatCurrency = (value: number): string => {
  if (value >= 1e12) {
    return (value / 1e12).toFixed(1) + "조";
  } else if (value >= 1e8) {
    return (value / 1e8).toFixed(1) + "억";
  } else if (value >= 1e4) {
    return (value / 1e4).toFixed(1) + "만";
  }
  return value.toLocaleString() + "원";
};

interface StockItem {
  id: number;
  name: string;
  symbol: string;
  currentPrice: number;
  priceChange: number; // 변동률 (%)
  marketCap: number; // 시가총액
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

// 100개의 임시 마켓 데이터 생성
const generateDummyStockData = (): StockItem[] => {
  const items: StockItem[] = [];
  for (let i = 1; i <= 100; i++) {
    const categoryCycle = i % 3; // 0: 국내, 1: 해외, 2: 암호화폐
    const currentPrice = Math.round(50000 + Math.random() * 100000);
    items.push({
      id: i,
      name: categoryCycle === 0 ? "삼성전자" : categoryCycle === 1 ? "현대차" : "LG전자",
      symbol: categoryCycle === 0 ? "005930" : categoryCycle === 1 ? "005380" : "066570",
      currentPrice,
      // 시가총액: 500억 원부터 5조 원 사이 (예시)
      marketCap: Math.round(5e10 + Math.random() * 4.5e12),
      priceChange: Number((Math.random() * 4 - 2).toFixed(2)),
      logo: "/panzee.webp",
      category: categoryCycle === 0 ? "국내" : categoryCycle === 1 ? "해외" : "암호화폐",
    });
  }
  return items;
};

const stockData = generateDummyStockData();

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
  {
    id: 3,
    title: "LG전자 혁신기술 공개",
    summary: "혁신 기술 공개 후 시장 반응 주시.",
    stockName: "LG전자",
    symbol: "066570",
    category: "해외",
    sentiment: "중립",
  },
  {
    id: 4,
    title: "카카오 경쟁 심화",
    summary: "경쟁 심화로 주가 하락세 지속.",
    stockName: "카카오",
    symbol: "035720",
    category: "해외",
    sentiment: "매우 부정",
  },
  {
    id: 5,
    title: "비트코인 강세",
    summary: "암호화폐 시장서 비트코인 강세 유지.",
    stockName: "비트코인",
    symbol: "BTC",
    category: "암호화폐",
    sentiment: "매우긍정",
  },
  {
    id: 6,
    title: "이더리움 불안정",
    summary: "시장 불안정성이 주가에 반영됨.",
    stockName: "이더리움",
    symbol: "ETH",
    category: "암호화폐",
    sentiment: "부정",
  },
];

const getSentimentBadgeStyles = (
  sentiment: StockItem["category"] | NewsSummaryItem["sentiment"],
) => {
  if (sentiment === "긍정" || sentiment === "매우긍정") return "bg-green-700 text-white";
  if (sentiment === "부정" || sentiment === "매우 부정") return "bg-red-700 text-white";
  return "bg-gray-700 text-white";
};

type SortKey = "name" | "currentPrice" | "priceChange" | "marketCap" | null;

const Market: React.FC = () => {
  // viewMode: 전체보기 / 즐겨찾기 보기 (좌측 상단 탭)
  const [viewMode, setViewMode] = useState<"전체" | "즐겨찾기">("전체");
  // 기존 필터 탭: 전체, 국내, 해외, 암호화폐 (우측 탭)
  const [selectedMarketTab, setSelectedMarketTab] = useState("전체");
  const filteredStocks =
    selectedMarketTab === "전체"
      ? stockData
      : stockData.filter((stock) => stock.category === selectedMarketTab);

  // 정렬 상태: 기본은 시가총액 내림차순
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "marketCap",
    direction: "desc",
  });

  const sortedStocks = useMemo(() => {
    let sorted = [...filteredStocks];
    if (sortConfig.key !== null) {
      const key = sortConfig.key!;
      if (key === "name") {
        sorted.sort((a, b) =>
          sortConfig.direction === "asc"
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name),
        );
      } else {
        sorted.sort((a, b) => {
          if (a[key] < b[key]) return sortConfig.direction === "asc" ? -1 : 1;
          if (a[key] > b[key]) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        });
      }
    }
    return sorted;
  }, [filteredStocks, sortConfig]);

  // viewMode (전체, 즐겨찾기) 에 따라 종목 필터링
  const [favorites, setFavorites] = useState<number[]>([]);
  const finalStocks = useMemo(() => {
    return viewMode === "전체"
      ? sortedStocks
      : sortedStocks.filter((stock) => favorites.includes(stock.id));
  }, [sortedStocks, viewMode, favorites]);

  // 초기 노출: 30개, 스크롤 시 추가 (5개씩)
  const [visibleCount, setVisibleCount] = useState(30);
  useEffect(() => {
    setVisibleCount(30);
  }, [filteredStocks, sortConfig, viewMode]);
  const visibleStocks = useMemo(
    () => finalStocks.slice(0, visibleCount),
    [finalStocks, visibleCount],
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.innerHeight + document.documentElement.scrollTop;
      const totalHeight = document.documentElement.offsetHeight;
      if (scrolled >= totalHeight - 10 && visibleCount < finalStocks.length) {
        setVisibleCount((prev) => Math.min(prev + 5, finalStocks.length));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [visibleCount, finalStocks]);

  const handleSort = (key: "name" | "currentPrice" | "priceChange" | "marketCap") => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "desc" };
    });
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]));
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 좌측 영역: 마켓 */}
        <div className="md:col-span-8">
          {/* 상단 통합 탭: 좌측 viewMode 탭 + 우측 필터 탭를 한 줄에 배치 */}
          <div className="flex items-center justify-between mb-4">
            {/* 좌측: viewMode 탭 (아이콘 사용, 기존과 동일한 감싸기) */}
            <div className="flex bg-gray-800 p-1 rounded-full border border-gray-600 space-x-2">
              {(["전체", "즐겨찾기"] as ("전체" | "즐겨찾기")[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setViewMode(tab)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200 ${
                    viewMode === tab
                      ? "bg-white/30 text-white"
                      : "bg-transparent text-white hover:bg-white/30"
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
            {/* 우측: 필터 탭 (전체, 국내, 해외, 암호화폐) */}
            <div className="flex bg-gray-800 p-1 rounded-full border border-gray-600 space-x-2">
              {["전체", "국내", "해외", "암호화폐"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedMarketTab(tab)}
                  className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                    selectedMarketTab === tab
                      ? "bg-white/30 text-white"
                      : "bg-transparent text-white hover:bg-white/30"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          {/* 테이블 헤더 (정렬 가능) */}
          <div className="flex items-center py-2 px-4 bg-gray-800 rounded-lg">
            {/* 즐겨찾기 영역 (빈 공간) */}
            <div className="w-10 h-10 flex justify-center items-center" />
            <div
              className="flex-1 text-left text-sm font-bold cursor-pointer hover:underline"
              onClick={() => handleSort("name")}
            >
              종목 / 심볼{" "}
              {sortConfig.key === "name" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </div>
            <div
              className="w-1/4 text-right text-sm font-bold cursor-pointer hover:underline"
              onClick={() => handleSort("currentPrice")}
            >
              현재가{" "}
              {sortConfig.key === "currentPrice" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </div>
            <div
              className="w-1/4 text-right text-sm font-bold cursor-pointer hover:underline"
              onClick={() => handleSort("priceChange")}
            >
              변동률{" "}
              {sortConfig.key === "priceChange" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </div>
            <div
              className="w-1/4 text-right text-sm font-bold cursor-pointer hover:underline"
              onClick={() => handleSort("marketCap")}
            >
              시가총액{" "}
              {sortConfig.key === "marketCap" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </div>
          </div>
          {/* 마켓 리스트 */}
          <div className="space-y-2 mt-2 transition-all duration-500 ease-in-out">
            {visibleStocks.map((stock, index) => (
              <div
                key={stock.id}
                className={`animate-fadeInUp flex items-center p-4 rounded-lg transition-colors duration-200 ${
                  index % 2 === 0 ? "bg-gray-900" : "bg-gray-900/95"
                } hover:bg-gray-800`}
              >
                {/* 즐겨찾기 아이콘 (정사각형 영역) */}
                <div className="w-10 h-10 flex justify-center items-center">
                  <button onClick={() => toggleFavorite(stock.id)} className="focus:outline-none">
                    <Icons
                      name="star"
                      className={`w-6 h-6 transition-colors duration-200 ${
                        favorites.includes(stock.id) ? "text-yellow-500" : "text-gray-400"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex-1 flex items-center space-x-3">
                  <img
                    src={stock.logo}
                    alt={stock.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-white font-semibold">{stock.name}</p>
                    <p className="text-sm text-gray-400">{stock.symbol}</p>
                  </div>
                </div>
                <div className="w-1/4 text-right">
                  <p className="text-white">{stock.currentPrice.toLocaleString()} 원</p>
                </div>
                <div className="w-1/4 text-right font-semibold">
                  <p className={stock.priceChange >= 0 ? "text-green-500" : "text-red-500"}>
                    {stock.priceChange >= 0
                      ? `+${stock.priceChange.toFixed(2)}%`
                      : `${stock.priceChange.toFixed(2)}%`}
                  </p>
                </div>
                <div className="w-1/4 text-right">
                  <p className="text-white">{formatCurrency(stock.marketCap)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* 우측 영역: 뉴스 현황 (sticky top-20) */}
        <div className="md:col-span-4">
          <div className="sticky top-20 bg-gray-800 p-4 rounded-lg transition-all duration-500 ease-in-out">
            <h2 className="text-xl font-bold text-white mb-4">뉴스 현황</h2>
            {newsSummaryData.map((news) => (
              <div
                key={news.id}
                className="animate-fadeInUp p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 mb-3"
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
                <div className="mb-1">
                  <p className="text-sm text-white font-semibold">
                    {news.stockName} <span className="text-sm text-gray-400">{news.symbol}</span>
                  </p>
                </div>
                <h3 className="text-base font-bold text-white">{news.title}</h3>
                <p className="text-sm text-gray-400">{news.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Market;
