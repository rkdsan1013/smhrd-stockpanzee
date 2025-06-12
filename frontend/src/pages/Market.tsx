// /frontend/src/pages/Market.tsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import Icons from "../components/Icons";
import io from "socket.io-client";  // 소켓 추가

// 숫자 단위 포맷 함수
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

const generateDummyStockData = (): StockItem[] => {
  const items: StockItem[] = [];
  for (let i = 1; i <= 100; i++) {
    const categoryCycle = i % 3;
    const currentPrice = Math.round(50000 + Math.random() * 100000);
    items.push({
      id: i,
      name: categoryCycle === 0 ? "삼성전자" : categoryCycle === 1 ? "현대차" : "LG전자",
      symbol: categoryCycle === 0 ? "005930" : categoryCycle === 1 ? "005380" : "066570",
      currentPrice,
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
  { id: 1, title: "삼성전자 신제품 발표", summary: "신제품 발표로 주가 상승 기대.", stockName: "삼성전자", symbol: "005930", category: "국내", sentiment: "긍정" },
  { id: 2, title: "현대차 실적 부진", summary: "실적 부진 우려 속 주가 하락.", stockName: "현대차", symbol: "005380", category: "국내", sentiment: "부정" },
  { id: 3, title: "LG전자 혁신기술 공개", summary: "혁신 기술 공개 후 시장 반응 주시.", stockName: "LG전자", symbol: "066570", category: "해외", sentiment: "중립" },
  { id: 4, title: "카카오 경쟁 심화", summary: "경쟁 심화로 주가 하락세 지속.", stockName: "카카오", symbol: "035720", category: "해외", sentiment: "매우 부정" },
  { id: 5, title: "비트코인 강세", summary: "암호화폐 시장서 비트코인 강세 유지.", stockName: "비트코인", symbol: "BTC", category: "암호화폐", sentiment: "매우긍정" },
  { id: 6, title: "이더리움 불안정", summary: "시장 불안정성이 주가에 반영됨.", stockName: "이더리움", symbol: "ETH", category: "암호화폐", sentiment: "부정" },
];

const getSentimentBadgeStyles = (sentiment: NewsSummaryItem["sentiment"]) => {
  if (sentiment === "긍정" || sentiment === "매우긍정") return "bg-green-700 text-white";
  if (sentiment === "부정" || sentiment === "매우 부정") return "bg-red-700 text-white";
  return "bg-gray-700 text-white";
};

type SortKey = "name" | "currentPrice" | "priceChange" | "marketCap" | null;

const Market: React.FC = () => {
  const [viewMode, setViewMode] = useState<"전체" | "즐겨찾기">("전체");
  const [selectedMarketTab, setSelectedMarketTab] = useState("전체");
  const filteredStocks = selectedMarketTab === "전체" ? stockData : stockData.filter((s) => s.category === selectedMarketTab);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: "asc" | "desc" }>({ key: "marketCap", direction: "desc" });

  const sortedStocks = useMemo(() => {
    let sorted = [...filteredStocks];
    if (sortConfig.key) {
      const key = sortConfig.key;
      if (key === "name") {
        sorted.sort((a, b) => sortConfig.direction === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
      } else {
        sorted.sort((a, b) => sortConfig.direction === "asc" ? a[key] - b[key] : b[key] - a[key]);
      }
    }
    return sorted;
  }, [filteredStocks, sortConfig]);

  const [favorites, setFavorites] = useState<number[]>([]);
  const finalStocks = useMemo(() => viewMode === "전체" ? sortedStocks : sortedStocks.filter((s) => favorites.includes(s.id)), [sortedStocks, viewMode, favorites]);

  const [visibleCount, setVisibleCount] = useState(30);
  useEffect(() => { setVisibleCount(30); }, [filteredStocks, sortConfig, viewMode]);
  const visibleStocks = useMemo(() => finalStocks.slice(0, visibleCount), [finalStocks, visibleCount]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 10 && visibleCount < finalStocks.length) {
        setVisibleCount((prev) => Math.min(prev + 5, finalStocks.length));
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [visibleCount, finalStocks]);

  const handleSort = (key: "name" | "currentPrice" | "priceChange" | "marketCap") => {
    setSortConfig((prev) => prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "desc" });
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]);
  };

  const socket = useRef(io("http://localhost:3001"));  // ⚠️ 서버 주소 확인
  const [updatedPrices, setUpdatedPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    stockData.forEach(({ symbol }) => { socket.current.emit("subscribe", symbol); });
    interface StockPriceUpdate { symbol: string; price: number }
    socket.current.on("stockPrice", ({ symbol, price }: StockPriceUpdate) => {
      setUpdatedPrices((prev) => ({ ...prev, [symbol]: price }));
    });
    return () => { socket.current.disconnect(); };
  }, []);

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8">
          <div className="flex justify-between mb-4">
            <div className="flex bg-gray-800 p-1 rounded-full border border-gray-600 space-x-2">
              {(["전체", "즐겨찾기"] as ("전체" | "즐겨찾기")[]).map((tab) => (
                <button key={tab} onClick={() => setViewMode(tab)}
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors duration-200 ${viewMode === tab ? "bg-white/30 text-white" : "bg-transparent text-white hover:bg-white/30"}`}>
                  {tab === "전체" ? <Icons name="list" className="w-6 h-6" /> : <Icons name="star" className="w-6 h-6" />}
                </button>
              ))}
            </div>
            <div className="flex bg-gray-800 p-1 rounded-full border border-gray-600 space-x-2">
              {["전체", "국내", "해외", "암호화폐"].map((tab) => (
                <button key={tab} onClick={() => setSelectedMarketTab(tab)}
                  className={`px-4 py-2 rounded-full transition-colors duration-200 ${selectedMarketTab === tab ? "bg-white/30 text-white" : "bg-transparent text-white hover:bg-white/30"}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {visibleStocks.map((stock, index) => {
            const livePrice = updatedPrices[stock.symbol] ?? stock.currentPrice;
            return (
              <div key={stock.id} className="flex items-center p-4 mb-2 bg-gray-800 rounded-lg">
                <div className="w-10 h-10 flex justify-center items-center">
                  <button onClick={() => toggleFavorite(stock.id)}><Icons name="star" className={`w-6 h-6 ${favorites.includes(stock.id) ? "text-yellow-500" : "text-gray-400"}`} /></button>
                </div>
                <div className="flex-1 flex items-center space-x-3">
                  <img src={stock.logo} alt={stock.name} className="w-10 h-10 rounded-full object-cover" />
                  <div><p className="text-white font-semibold">{stock.name}</p><p className="text-sm text-gray-400">{stock.symbol}</p></div>
                </div>
                <div className="w-1/4 text-right text-white">{livePrice.toLocaleString()} 원</div>
                <div className="w-1/4 text-right font-semibold">
                  <p className={stock.priceChange >= 0 ? "text-green-500" : "text-red-500"}>
                    {stock.priceChange >= 0 ? `+${stock.priceChange.toFixed(2)}%` : `${stock.priceChange.toFixed(2)}%`}
                  </p>
                </div>
                <div className="w-1/4 text-right text-white">{formatCurrency(stock.marketCap)}</div>
              </div>
            );
          })}
        </div>

        <div className="md:col-span-4">
          <div className="sticky top-20 bg-gray-800 p-4 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">뉴스 현황</h2>
            {newsSummaryData.map((news) => (
              <div key={news.id} className="p-3 rounded-lg hover:bg-gray-700 mb-3">
                <div className="flex space-x-2 mb-1">
                  <span className="px-2 py-1 text-xs font-bold rounded-full bg-gray-700 text-white">{news.category}</span>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${getSentimentBadgeStyles(news.sentiment)}`}>{news.sentiment}</span>
                </div>
                <div className="mb-1"><p className="text-sm text-white font-semibold">{news.stockName} <span className="text-sm text-gray-400">{news.symbol}</span></p></div>
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