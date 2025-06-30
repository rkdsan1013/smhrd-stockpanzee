// frontend/src/pages/Market.tsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Icons from "../components/Icons";
import Tooltip from "../components/Tooltip";
import { fetchAssets } from "../services/assetService";
import { fuzzySearch } from "../utils/search";
import { formatCurrency, formatPercentage } from "../utils/formats";

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

  // state
  const [tab, setTab] = useState<StockItem["category"] | "전체">("전체");
  const [viewMode, setViewMode] = useState<"전체" | "즐겨찾기">("전체");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<StockItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "marketCap",
    dir: "desc",
  });
  const [page, setPage] = useState(1);

  // refs for highlight
  const prevPrices = useRef<Map<number, number>>(new Map());
  const highlight = useRef<Map<number, "up" | "down">>(new Map());
  const [, forceR] = useState(0);

  // fetch & highlight effect
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
                forceR((v) => v + 1);
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

  // reset page
  useEffect(() => {
    setPage(1);
  }, [tab, viewMode, sortConfig, search]);

  // filter by tab
  const byTab = useMemo(
    () => (tab === "전체" ? data : data.filter((s) => s.category === tab)),
    [data, tab],
  );

  // apply view mode
  const byView = useMemo(() => {
    if (viewMode === "즐겨찾기") {
      return byTab.filter((s) => favorites.includes(s.id));
    }
    return [...byTab].sort((a, b) =>
      favorites.includes(a.id) === favorites.includes(b.id) ? 0 : favorites.includes(a.id) ? -1 : 1,
    );
  }, [byTab, viewMode, favorites]);

  // sort
  const sorted = useMemo(() => {
    if (search.trim()) return byView;
    const factor = sortConfig.dir === "asc" ? 1 : -1;
    return [...byView].sort((a, b) =>
      sortConfig.key === "name"
        ? a.name.localeCompare(b.name) * factor
        : ((a as any)[sortConfig.key] - (b as any)[sortConfig.key]) * factor,
    );
  }, [byView, sortConfig, search]);

  // search
  const searched = useMemo(
    () =>
      search.trim()
        ? fuzzySearch(sorted, search, { keys: ["name", "symbol"], threshold: 0.3 })
        : sorted,
    [sorted, search],
  );

  // paginate + infinite scroll
  const finalList = searched;
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

  // handlers
  const toggleFav = (id: number) =>
    setFavorites((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const sortCol = (key: SortKey) => {
    if (search.trim()) return;
    setSortConfig((p) =>
      p.key === key ? { key, dir: p.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" },
    );
  };
  const toggleView = () => setViewMode((m) => (m === "전체" ? "즐겨찾기" : "전체"));

  // summary metrics
  const summary = byTab;
  const total = summary.length;
  const cLargeDown = summary.filter((s) => s.priceChange < -BIG_CHANGE).length;
  const cSmallDown = summary.filter(
    (s) => s.priceChange < 0 && s.priceChange >= -BIG_CHANGE,
  ).length;
  const cZero = summary.filter((s) => s.priceChange === 0).length;
  const cSmallUp = summary.filter((s) => s.priceChange > 0 && s.priceChange <= BIG_CHANGE).length;
  const cLargeUp = summary.filter((s) => s.priceChange > BIG_CHANGE).length;

  const upPct = total ? ((cSmallUp + cLargeUp) / total) * 100 : 0;
  const downPct = total ? ((cSmallDown + cLargeDown) / total) * 100 : 0;

  const mean = total ? summary.reduce((sum, s) => sum + s.priceChange, 0) / total : 0;
  const variance = total
    ? summary.reduce((sum, s) => sum + (s.priceChange - mean) ** 2, 0) / total
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
      <header className="py-4">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white text-3xl font-bold">자산 마켓</h1>
        </div>
      </header>

      <section className="container mx-auto px-4 py-6 max-w-7xl space-y-4">
        {/* Nav (container width) */}
        <div className="container mx-auto px-4">
          <div className="bg-gray-800 rounded-full flex items-center px-2 py-1 space-x-2">
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
                className={`px-4 py-1 rounded-full text-sm font-medium transition-colors ${
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
                    onClick={() => sortCol(col.key)}
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
              const borderColor =
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
                    flex items-center px-4 py-2 rounded-lg border-2 ${borderColor}
                    transition-colors duration-500 ease-in-out cursor-pointer
                    hover:bg-gray-700 hover:scale-[1.003]
                  `}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFav(s.id);
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

          {/* Search & Summary */}
          <div className="w-full md:w-1/3">
            <div className="sticky top-20 space-y-4">
              <input
                type="text"
                placeholder="종목명·심볼 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:outline-none"
              />

              <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 text-white">
                <h2 className="text-xl font-bold text-center">{statusTitle}</h2>

                {/* 5-step bar */}
                <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden flex">
                  {[
                    { cnt: cLargeDown, color: "bg-red-700", label: `큰 하락 ${cLargeDown}` },
                    { cnt: cSmallDown, color: "bg-red-400", label: `하락 ${cSmallDown}` },
                    { cnt: cZero, color: "bg-gray-500", label: `변동 없음 ${cZero}` },
                    { cnt: cSmallUp, color: "bg-green-400", label: `상승 ${cSmallUp}` },
                    { cnt: cLargeUp, color: "bg-green-700", label: `큰 상승 ${cLargeUp}` },
                  ].map(({ cnt, color, label }) => {
                    const pct = total ? (cnt / total) * 100 : 0;
                    return (
                      <Tooltip key={label} label={label} style={{ width: `${pct}%` }}>
                        <div className={`${color} h-full`} />
                      </Tooltip>
                    );
                  })}
                </div>

                {/* Metrics cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center bg-gray-700 p-2 rounded-lg">
                    <Icons name="caretUp" className="w-5 h-5 text-green-400" />
                    <div className="ml-2">
                      <p className="text-xs text-gray-300">상승 비율</p>
                      <p className="text-lg font-semibold">{formatPercentage(upPct)}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-gray-700 p-2 rounded-lg">
                    <Icons name="caretDown" className="w-5 h-5 text-red-400" />
                    <div className="ml-2">
                      <p className="text-xs text-gray-300">하락 비율</p>
                      <p className="text-lg font-semibold">{formatPercentage(downPct)}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-gray-700 p-2 rounded-lg">
                    <Icons name="volatility" className="w-5 h-5 text-yellow-300" />
                    <div className="ml-2">
                      <p className="text-xs text-gray-300">변동성</p>
                      <p className="text-lg font-semibold">{formatPercentage(volatility)}</p>
                    </div>
                  </div>
                </div>

                {/* Top 3 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-300 mb-1">Top 3 상승</p>
                    <div className="space-y-2">
                      {topGainers.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => navigate(`/asset/${s.id}`, { state: { asset: s } })}
                          className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                        >
                          <span className="text-white font-medium">{s.symbol}</span>
                          <span className="text-green-400 font-semibold">
                            {formatPercentage(s.priceChange)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-300 mb-1">Top 3 하락</p>
                    <div className="space-y-2">
                      {topLosers.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => navigate(`/asset/${s.id}`, { state: { asset: s } })}
                          className="flex justify-between items-center bg-gray-700 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                        >
                          <span className="text-white font-medium">{s.symbol}</span>
                          <span className="text-red-400 font-semibold">
                            {formatPercentage(s.priceChange)}
                          </span>
                        </div>
                      ))}
                    </div>
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
