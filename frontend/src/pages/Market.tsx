// /frontend/src/pages/Market.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import Icons from "../components/Icons";
import { fetchAssets } from "../services/assetService";
import type { Asset } from "../services/assetService";
import { FixedSizeList as List } from "react-window";
import type { ListChildComponentProps, FixedSizeList } from "react-window";

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

  // react-window List 참조 (내부 스크롤 제어용)
  const listRef = useRef<FixedSizeList>(null);

  // API 호출 후 자산 데이터 및 카테고리 설정
  useEffect(() => {
    fetchAssets()
      .then((assets: Asset[]) => {
        const list: StockItem[] = assets.map((a) => {
          let category: StockItem["category"];
          // 금융 용어 "KOSPI", "KOSDAQ"는 cSpell에서 무시하세요.
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
            // "panzee"는 프로젝트 고유 단어로 cSpell에서 무시하세요.
            logo: "/panzee.webp",
            category,
          };
        });
        setStockData(list);
      })
      .catch(console.error);
  }, []);

  // 탭(viewMode, selectedMarketTab) 변경 시 List 컴포넌트를 재마운트하여 스크롤 오프셋 초기화
  useEffect(() => {
    listRef.current?.scrollToItem(0, "start");
  }, [viewMode, selectedMarketTab]);

  const filteredStocks = useMemo(() => {
    return selectedMarketTab === "전체"
      ? stockData
      : stockData.filter((s) => s.category === selectedMarketTab);
  }, [stockData, selectedMarketTab]);

  const sortedStocks = useMemo(() => {
    const { key, direction } = sortConfig;
    const dir = direction === "asc" ? 1 : -1;
    return [...filteredStocks].sort((a, b) => {
      if (key === "name") return a.name.localeCompare(b.name) * dir;
      return (a[key] - b[key]) * dir;
    });
  }, [filteredStocks, sortConfig]);

  const finalStocks = useMemo(() => {
    if (viewMode === "전체") {
      const favoriteStocks = sortedStocks.filter((s) => favorites.includes(s.id));
      const nonFavoriteStocks = sortedStocks.filter((s) => !favorites.includes(s.id));
      return [...favoriteStocks, ...nonFavoriteStocks];
    }
    return sortedStocks.filter((s) => favorites.includes(s.id));
  }, [sortedStocks, viewMode, favorites]);

  const gridCols = "grid grid-cols-[40px_minmax(0,1fr)_120px_100px_120px] items-center";

  // handleSort: 객체 리터럴을 바로 반환할 때 괄호로 감싸줌.
  const handleSort = (key: SortKey) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" },
    );
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 좌측: 자산 리스트 영역 (react-window 가상 스크롤 적용, 기본 스크롤바 숨김) */}
        <div className="md:col-span-9 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            {/* 전체/즐겨찾기 탭 */}
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
            {/* 마켓 필터 탭 */}
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
          {/* 헤더: 정렬 기능 포함 */}
          <div
            className={`${gridCols} py-2 px-4 bg-gray-800 rounded-lg text-sm font-bold text-white`}
          >
            <div />
            <div onClick={() => handleSort("name")} className="cursor-pointer hover:underline">
              종목 {sortConfig.key === "name" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </div>
            <div
              onClick={() => handleSort("currentPrice")}
              className="text-right cursor-pointer hover:underline"
            >
              현재가{" "}
              {sortConfig.key === "currentPrice" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </div>
            <div
              onClick={() => handleSort("priceChange")}
              className="text-right cursor-pointer hover:underline"
            >
              변동률{" "}
              {sortConfig.key === "priceChange" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </div>
            <div
              onClick={() => handleSort("marketCap")}
              className="text-right cursor-pointer hover:underline"
            >
              시가총액{" "}
              {sortConfig.key === "marketCap" && (sortConfig.direction === "asc" ? " ▲" : " ▼")}
            </div>
          </div>
          {/* 가상 스크롤 적용: react-window List 사용 (기본 스크롤바 숨김) */}
          <div
            className="mt-2 no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <List
              key={`${viewMode}-${selectedMarketTab}`}
              ref={listRef}
              height={600} // 리스트 영역 높이
              itemCount={finalStocks.length}
              itemSize={80} // 각 항목 높이
              width="100%"
              className="no-scrollbar"
            >
              {({ index, style }: ListChildComponentProps) => {
                const stock = finalStocks[index];
                const rowBg = index % 2 === 0 ? "bg-gray-900" : "bg-gray-900/95";
                return (
                  <div
                    style={style}
                    key={stock.id}
                    className={`${gridCols} p-4 rounded-lg transition-colors duration-200 ${rowBg} hover:bg-gray-800`}
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
                );
              }}
            </List>
          </div>
        </div>
        {/* 우측: 뉴스 영역 (sticky 제거) */}
        <div className="md:col-span-3">
          <div className="bg-gray-800 p-4 rounded-lg transition-all duration-500 ease-in-out flex flex-col h-[80vh]">
            <h2 className="text-xl font-bold text-white mb-4">뉴스 현황</h2>
            <div
              className="overflow-y-auto flex-1 pr-2 no-scrollbar"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <p className="text-sm text-gray-400">뉴스 데이터가 아직 없습니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Market;
