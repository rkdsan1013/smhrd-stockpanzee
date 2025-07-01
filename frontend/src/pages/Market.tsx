// /frontend/src/pages/Market.tsx
import React, { useState, useEffect, useMemo, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Icons from "../components/Icons";
import Tooltip from "../components/Tooltip";
import { fetchAssets } from "../services/assetService";
import { fuzzySearch } from "../utils/search";
import { formatCurrency, formatPercentage } from "../utils/formats";
import { AuthContext } from "../providers/AuthProvider";
import { fetchFavorites, addFavorite, removeFavorite } from "../services/favoriteService";
import socket from "../socket";

interface StockItem {
  id: number;
  name: string;
  symbol: string;
  currentPrice: number;
  priceChange: number;
  marketCap: number;
  category: "국내" | "해외" | "암호화폐" | "기타";
}

type SortKey = "name" | "currentPrice" | "priceChange" | "marketCap";

const BIG_CHANGE = 5;
const ITEMS_PER_PAGE = 12;

const Market: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // State & refs
  const [tab, setTab] = useState<StockItem["category"] | "전체">("전체");
  const [viewMode, setViewMode] = useState<"전체" | "즐겨찾기">("전체");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<StockItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    dir: "asc" | "desc";
  }>({ key: "marketCap", dir: "desc" });
  const [page, setPage] = useState(1);

  const prevPrices = useRef<Map<number, number>>(new Map());
  const highlight = useRef<Map<number, "up" | "down">>(new Map());
  const [, rerender] = useState(0);

  // 1) 자산 데이터 로드 및 가격 변동 하이라이트
  useEffect(() => {
    const load = () =>
      fetchAssets()
        .then((assets) => {
          const list = assets.map<StockItem>((a) => ({
            id: a.id,
            name: a.name,
            symbol: a.symbol,
            currentPrice: a.currentPrice,
            priceChange: a.priceChange,
            marketCap: a.marketCap,
            category: ["KOSPI", "KOSDAQ"].includes(a.market)
              ? "국내"
              : ["NASDAQ", "NYSE"].includes(a.market)
                ? "해외"
                : a.market === "Binance"
                  ? "암호화폐"
                  : "기타",
          }));

          list.forEach((item) => {
            const prev = prevPrices.current.get(item.id);
            if (prev !== undefined && prev !== item.currentPrice) {
              highlight.current.set(item.id, item.currentPrice > prev ? "up" : "down");
              setTimeout(() => {
                highlight.current.delete(item.id);
                rerender((v) => v + 1);
              }, 500);
            }
            prevPrices.current.set(item.id, item.currentPrice);
          });
          setData(list);
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
      prev.map((stock: { symbol: string; category: string; }) =>
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

  // 2) 사용자 로그인 상태 변경 시 즐겨찾기 리스트 동기화
  useEffect(() => {
    if (user) {
      fetchFavorites()
        .then((list) => setFavorites(list))
        .catch((err) => {
          console.error("즐겨찾기 조회 실패:", err);
          setFavorites([]);
        });
    } else {
      setFavorites([]);
    }
  }, [user]);

  // 3) 필터/정렬/검색 변경 시 페이지 리셋
  useEffect(() => {
    setPage(1);
  }, [tab, viewMode, sortConfig, search]);

  // 4) 데이터 가공: 탭 → 뷰 모드 → 정렬 → 검색 → 페이징
  const byTab = useMemo(
    () => (tab === "전체" ? data : data.filter((s) => s.category === tab)),
    [data, tab],
  );

  const byView = useMemo(() => {
    if (viewMode === "즐겨찾기") {
      return byTab.filter((s) => favorites.includes(s.id));
    }
    return [...byTab].sort((a, b) =>
      favorites.includes(a.id) === favorites.includes(b.id) ? 0 : favorites.includes(a.id) ? -1 : 1,
    );
  }, [byTab, viewMode, favorites]);

  const sorted = useMemo(() => {
    if (search.trim()) return byView;
    const f = sortConfig.dir === "asc" ? 1 : -1;
    return [...byView].sort((a, b) =>
      sortConfig.key === "name"
        ? a.name.localeCompare(b.name) * f
        : ((a as any)[sortConfig.key] - (b as any)[sortConfig.key]) * f,
    );
  }, [byView, sortConfig, search]);

  const finalList = useMemo(
    () =>
      search.trim()
        ? fuzzySearch(sorted, search, {
            keys: ["name", "symbol"],
            threshold: 0.3,
          })
        : sorted,
    [sorted, search],
  );

  const visible = finalList.slice(0, page * ITEMS_PER_PAGE);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && visible.length < finalList.length && setPage((p) => p + 1),
      { threshold: 1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible.length, finalList.length]);

  // 5) 즐겨찾기 토글 핸들러
  const toggleFav = async (id: number) => {
    if (!user) {
      alert("즐겨찾기를 추가하려면 로그인해주세요.");
      navigate("/login");
      return;
    }
    const isFav = favorites.includes(id);
    try {
      if (isFav) {
        await removeFavorite(id);
        setFavorites((prev) => prev.filter((x) => x !== id));
      } else {
        await addFavorite(id);
        setFavorites((prev) => [...prev, id]);
      }
    } catch (err) {
      console.error("즐겨찾기 업데이트 실패:", err);
      alert("즐겨찾기 업데이트에 실패했습니다.");
    }
  };

  // 6) 기타 핸들러
  const handleSort = (key: SortKey) => {
    if (search.trim()) return;
    setSortConfig((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" },
    );
  };

  const toggleView = () => setViewMode((m) => (m === "전체" ? "즐겨찾기" : "전체"));

  // 7) 요약 지표 계산
  const summary = byTab;
  const total = summary.length;
  const largeDown = summary.filter((s) => s.priceChange < -BIG_CHANGE).length;
  const smallDown = summary.filter((s) => s.priceChange < 0 && s.priceChange >= -BIG_CHANGE).length;
  const zero = summary.filter((s) => s.priceChange === 0).length;
  const smallUp = summary.filter((s) => s.priceChange > 0 && s.priceChange <= BIG_CHANGE).length;
  const largeUp = summary.filter((s) => s.priceChange > BIG_CHANGE).length;

  const upPct = total ? ((smallUp + largeUp) / total) * 100 : 0;
  const downPct = total ? ((smallDown + largeDown) / total) * 100 : 0;
  const meanChange = total ? summary.reduce((sum, s) => sum + s.priceChange, 0) / total : 0;
  const variance = total
    ? summary.reduce((sum, s) => sum + (s.priceChange - meanChange) ** 2, 0) / total
    : 0;
  const volatility = Math.sqrt(variance);

  const topGainers = [...summary].sort((a, b) => b.priceChange - a.priceChange).slice(0, 3);
  const topLosers = [...summary].sort((a, b) => a.priceChange - b.priceChange).slice(0, 3);

  const headerCols = [
    { key: "name", label: "종목", width: "flex-1 text-left" },
    { key: "currentPrice", label: "현재가", width: "w-28 text-right" },
    { key: "priceChange", label: "변동률", width: "w-20 text-right" },
    { key: "marketCap", label: "시가총액", width: "w-36 text-right" },
  ] as const;

  const statusTitle = `${tab} 시장 현황`;

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="py-4 text-center">
        <h1 className="text-white text-3xl font-bold">자산 마켓</h1>
      </header>

      <section className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        {/* Nav tabs */}
        <div className="flex mb-4">
          <div className="inline-flex bg-gray-800 p-2 rounded-full space-x-2">
            <button onClick={toggleView} className="p-2 rounded-full">
              <Icons
                name="banana"
                className={`w-5 h-5 ${
                  viewMode === "즐겨찾기" ? "text-yellow-400" : "text-gray-500"
                }`}
              />
            </button>
            {(["전체", "국내", "해외", "암호화폐"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300 ${
                  tab === t
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-blue-500 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Stock list */}
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
                          ? sortConfig.dir === "asc"
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
              const hl = highlight.current.get(s.id);
              const border =
                hl === "up"
                  ? "border-green-400"
                  : hl === "down"
                    ? "border-red-400"
                    : "border-transparent";
              return (
                <div
                  key={s.id}
                  onClick={() => navigate(`/asset/${s.id}`, { state: { asset: s } })}
                  className={`flex items-center px-4 py-2 rounded-lg border-2 ${border}
                    transition-colors duration-500 ease-in-out cursor-pointer hover:bg-gray-700 hover:scale-[1.003]`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFav(s.id);
                    }}
                    className={`w-8 h-8 flex items-center justify-center transition-all ${
                      !user ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Icons
                      name="banana"
                      className={`w-5 h-5 ${
                        favorites.includes(s.id) ? "text-yellow-400" : "text-gray-500"
                      }`}
                    />
                  </button>

                  <div className="flex-1 ml-2">
                    <p className="text-white font-medium">{s.name}</p>
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
                    {formatPercentage(s.priceChange)}
                  </div>
                  <div className="w-36 text-right text-gray-200 ml-2">
                    {formatCurrency(s.marketCap)}
                  </div>
                </div>
              );
            })}

            {visible.length < finalList.length && <div ref={loadMoreRef} className="h-2" />}
          </div>

          {/* Search & summary */}
          <div className="w-full md:w-1/3">
            <div className="sticky top-20 space-y-4">
              <div className="relative">
                <Icons
                  name="search"
                  className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2"
                />
                <input
                  type="text"
                  placeholder="종목명·심볼 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 p-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none"
                />
              </div>

              <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 text-white">
                <h2 className="text-xl font-bold text-center">{statusTitle}</h2>

                {/* 5-step bar */}
                <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden flex">
                  {[
                    { cnt: largeDown, color: "bg-red-700", label: `큰 하락: ${largeDown}` },
                    { cnt: smallDown, color: "bg-red-400", label: `하락: ${smallDown}` },
                    { cnt: zero, color: "bg-gray-500", label: `변동 없음: ${zero}` },
                    { cnt: smallUp, color: "bg-green-400", label: `상승: ${smallUp}` },
                    { cnt: largeUp, color: "bg-green-700", label: `큰 상승: ${largeUp}` },
                  ].map(({ cnt, color, label }) => {
                    const pct = total ? (cnt / total) * 100 : 0;
                    return (
                      <Tooltip key={label} label={label} style={{ width: `${pct}%` }}>
                        <div className={`${color} h-full`} />
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Metric cards */}
                <div className="grid grid-cols-3 gap-3">
                  <MetricCard
                    icon="caretUp"
                    iconColor="text-green-400"
                    label="상승 비율"
                    value={formatPercentage(upPct)}
                  />
                  <MetricCard
                    icon="caretDown"
                    iconColor="text-red-400"
                    label="하락 비율"
                    value={formatPercentage(downPct)}
                  />
                  <MetricCard
                    icon="volatility"
                    iconColor="text-yellow-300"
                    label="변동성"
                    value={formatPercentage(volatility)}
                  />
                </div>

                {/* Top 3 momentum */}
                <div className="grid grid-cols-2 gap-4">
                  <MomentumList
                    title="Top 3 상승"
                    items={topGainers}
                    positive
                    onItemClick={(id) =>
                      navigate(`/asset/${id}`, {
                        state: { asset: summary.find((s) => s.id === id)! },
                      })
                    }
                  />
                  <MomentumList
                    title="Top 3 하락"
                    items={topLosers}
                    positive={false}
                    onItemClick={(id) =>
                      navigate(`/asset/${id}`, {
                        state: { asset: summary.find((s) => s.id === id)! },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// MetricCard component
interface MetricCardProps {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
}
const MetricCard: React.FC<MetricCardProps> = ({ icon, iconColor, label, value }) => (
  <div className="flex items-center bg-gray-700 p-2 rounded-lg">
    <Icons name={icon} className={`w-5 h-5 ${iconColor}`} />
    <div className="ml-2">
      <p className="text-xs text-gray-300">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  </div>
);

// MomentumList component
interface MomentumListProps {
  title: string;
  items: StockItem[];
  positive?: boolean;
  onItemClick: (id: number) => void;
}
const MomentumList: React.FC<MomentumListProps> = ({
  title,
  items,
  positive = true,
  onItemClick,
}) => (
  <div>
    <p className="text-gray-300 mb-1">{title}</p>
    <div className="space-y-2">
      {items.map((s) => (
        <div
          key={s.id}
          onClick={() => onItemClick(s.id)}
          className="bg-gray-700 p-3 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
        >
          <p className="text-white font-medium truncate">{s.name}</p>
          <p
            className={`mt-1 text-sm font-semibold ${positive ? "text-green-400" : "text-red-400"}`}
          >
            {formatPercentage(s.priceChange)}
          </p>
        </div>
      ))}
    </div>
  </div>
);

export default Market;

function setStockData(arg0: (prev: any) => any) {
  throw new Error("Function not implemented.");
}
