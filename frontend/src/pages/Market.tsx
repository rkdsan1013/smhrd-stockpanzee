// frontend/src/pages/Market.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icons from "../components/Icons";
import Tooltip from "../components/Tooltip";
import { fetchAssets } from "../services/assetService";
import type { Asset } from "../services/assetService";
import socket from "../socket";

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

// “큰” 변동 임계값 (퍼센트)
const BIG_CHANGE_THRESHOLD = 5;

const Market: React.FC = () => {
  const navigate = useNavigate();

  // 탭 상태: "전체" | "국내" | "해외" | "암호화폐"
  const [selectedMarketTab, setSelectedMarketTab] = useState<StockItem["category"] | "전체">(
    "전체",
  );
  const [viewMode, setViewMode] = useState<"전체" | "즐겨찾기">("전체");
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: "asc" | "desc";
  }>({ key: "marketCap", direction: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const previousPricesRef = useRef<Map<number, number>>(new Map());
  const highlightMapRef = useRef<Map<number, "up" | "down">>(new Map());
  const [, forceUpdate] = useState(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 데이터 로드 및 변화 하이라이트
  useEffect(() => {
    const load = () =>
      fetchAssets()
        .then((assets: Asset[]) => {
          const list = assets.map<StockItem>((a) => ({
            id: a.id,
            name: a.name,
            symbol: a.symbol,
            currentPrice: a.currentPrice,
            priceChange: a.priceChange,
            marketCap: a.marketCap,
            logo: "/panzee.webp",
            category:
              ["KOSPI", "KOSDAQ"].includes(a.market)
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

  // ✅ Market.tsx - 웹소켓 우선 적용 구조 반영
useEffect(() => {
  socket.on("stockPrice", (data: { symbol: string; price: any; rate: any; marketCap: any }) => {
    setStockData((prev) =>
      prev.map((stock) =>
        stock.symbol === data.symbol && stock.category === "국내" // 🔥 국내 주식만!
          ? {
              ...stock,
              currentPrice: Number(data.price),
              priceChange: Number(data.rate),
              marketCap: Number(data.marketCap),
            }
          : stock
      )
    );
  });
  return () => {
    socket.off("stockPrice");
  };
}, []);

  // 탭/정렬 변경 시 페이지 번호 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMarketTab, viewMode, sortConfig]);

  // 필터링 → 정렬 → 페이징
  const filtered = useMemo(
    () =>
      selectedMarketTab === "전체"
        ? stockData
        : stockData.filter((s) => s.category === selectedMarketTab),
    [stockData, selectedMarketTab]
  );

  const sorted = useMemo(() => {
  const factor = sortConfig.direction === "asc" ? 1 : -1;
  const key = sortConfig.key; // ✅ key를 변수로 선언!

  return [...filtered].sort((a, b) =>
    key === "name"
      ? a.name.localeCompare(b.name) * factor
      : ((a as any)[key] - (b as any)[key]) * factor
  );
}, [filtered, sortConfig]);


  const finalList = useMemo(() => {
    const withFavorites = [...sorted].sort((a, b) =>
      favorites.includes(a.id) === favorites.includes(b.id) ? 0 : favorites.includes(a.id) ? -1 : 1,
    );
    return viewMode === "전체" ? withFavorites : sorted.filter((s) => favorites.includes(s.id));
  }, [sorted, viewMode, favorites]);

  const visible = useMemo(
    () => finalList.slice(0, currentPage * itemsPerPage),
    [finalList, currentPage]
  );

  // 변동 통계: 큰/작은 상승·하락 + 변동 없음
  const fallingLargeCount = finalList.filter((s) => s.priceChange < -BIG_CHANGE_THRESHOLD).length;
  const fallingSmallCount = finalList.filter(
    (s) => s.priceChange < 0 && s.priceChange >= -BIG_CHANGE_THRESHOLD,
  ).length;
  const unchangedCount = finalList.filter((s) => s.priceChange === 0).length;
  const risingSmallCount = finalList.filter(
    (s) => s.priceChange > 0 && s.priceChange <= BIG_CHANGE_THRESHOLD,
  ).length;
  const risingLargeCount = finalList.filter((s) => s.priceChange > BIG_CHANGE_THRESHOLD).length;

  const totalCount = finalList.length;
  const avgPrice = totalCount
    ? Math.round(finalList.reduce((sum, s) => sum + s.currentPrice, 0) / totalCount)
    : 0;
  const totalMarketCap = finalList.reduce((sum, s) => sum + s.marketCap, 0);

  // 무한 스크롤 옵저버
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visible.length < finalList.length) {
          setCurrentPage((p) => p + 1);
        }
      },
      { threshold: 1 }
    );

    observer.observe(el);

    return () => observer.unobserve(el); // ✅ 반드시 void 반환
  }, [visible, finalList]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // 컬럼 정렬 토글
  const handleSort = (key: SortKey) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "desc" }
    );
  };

  const headerCols = [
    { key: "name", label: "종목", width: "flex-1 text-left" },
    { key: "currentPrice", label: "현재가", width: "w-28 text-right" },
    { key: "priceChange", label: "변동률", width: "w-20 text-right" },
    { key: "marketCap", label: "시가총액", width: "w-36 text-right" },
  ] as const;

  // 요약 카드 제목: "전체 시장 현황", "국내 시장 현황" 등
  const statusTitle = `${selectedMarketTab} 시장 현황`;

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="py-4">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white text-3xl font-bold">자산 마켓</h1>
        </div>
      </header>
      <section className="container mx-auto px-4 py-6 max-w-7xl">
        {/* 상단 탭 */}
        <div className="flex flex-wrap justify-between gap-4 mb-4">
          <div className="flex space-x-2 bg-gray-800 p-2 rounded-full">
            {(["전체", "국내", "해외", "암호화폐"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedMarketTab(tab)}
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
          {/* 좌측 종목 리스트 */}
          <div className="w-full md:w-2/3 space-y-2">
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
                    flex items-center px-4 py-2 rounded-lg border-2
                    transition-all duration-500 cursor-pointer
                    hover:bg-gray-700 hover:scale-[1.005]
                    ${borderClass}
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

          {/* 우측 요약 카드 */}
          <div className="w-full md:w-1/3">
            <div className="sticky top-20 bg-gray-800 rounded-lg shadow p-6 space-y-4">
              {/* 동적으로 탭 문자열을 붙인 제목 */}
              <h2 className="text-lg font-bold text-white text-center">{statusTitle}</h2>

              {/* 5단계 스택형 바 차트 with Tooltip */}
              <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden flex">
                {[
                  {
                    count: fallingLargeCount,
                    color: "bg-red-700",
                    label: `큰 하락: ${fallingLargeCount}건`,
                  },
                  {
                    count: fallingSmallCount,
                    color: "bg-red-400",
                    label: `하락: ${fallingSmallCount}건`,
                  },
                  {
                    count: unchangedCount,
                    color: "bg-gray-500",
                    label: `변동 없음: ${unchangedCount}건`,
                  },
                  {
                    count: risingSmallCount,
                    color: "bg-green-400",
                    label: `상승: ${risingSmallCount}건`,
                  },
                  {
                    count: risingLargeCount,
                    color: "bg-green-700",
                    label: `큰 상승: ${risingLargeCount}건`,
                  },
                ].map(({ count, color, label }) => {
                  const pct = totalCount ? (count / totalCount) * 100 : 0;
                  return (
                    <Tooltip key={label} label={label} style={{ width: `${pct}%` }}>
                      <div className={`${color} w-full h-full`} />
                    </Tooltip>
                  );
                })}
              </div>

              {/* 범례 */}
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

              {/* 주요 지표 */}
              <div className="space-y-2">
                <div className="flex justify-between text-gray-400">
                  <span>총 종목 수</span>
                  <span className="text-gray-200 font-semibold">{totalCount}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>평균 현재가</span>
                  <span className="text-gray-200 font-semibold">
                    {avgPrice.toLocaleString()} 원
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>전체 시가총액</span>
                  <span className="text-gray-200 font-semibold">
                    {formatCurrency(totalMarketCap)}
                  </span>
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
