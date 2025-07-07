// /frontend/src/pages/Market.tsx
import React, { useState, useEffect, useMemo, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Icons from "../components/Icons";
import MarketSkeleton from "../components/skeletons/MarketSkeleton";
import MarketSidebar from "../components/MarketSidebar";
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
  const [loading, setLoading] = useState(true);

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
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // 1) load & highlight
  useEffect(() => {
    const load = async () => {
      try {
        const assets = await fetchAssets();
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
      } catch {}
      setLoading(false);
    };

    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  // 2) socket updates
  useEffect(() => {
    const handler = (upd: { symbol: string; price: number; rate: number; marketCap: number }) => {
      setData((prev) =>
        prev.map((s) => {
          if (s.symbol === upd.symbol && s.category === "국내") {
            const prevPrice = s.currentPrice;
            if (prevPrice !== upd.price) {
              highlight.current.set(s.id, upd.price > prevPrice ? "up" : "down");
              setTimeout(() => {
                highlight.current.delete(s.id);
                rerender((v) => v + 1);
              }, 500);
            }
            return {
              ...s,
              currentPrice: upd.price,
              priceChange: upd.rate,
              marketCap: upd.marketCap,
            };
          }
          return s;
        }),
      );
    };

    socket.on("stockPrice", handler);
    return () => void socket.off("stockPrice", handler);
  }, []);

  // 3) favorites load
  useEffect(() => {
    if (user) {
      fetchFavorites()
        .then(setFavorites)
        .catch(() => setFavorites([]));
    } else {
      setFavorites([]);
    }
  }, [user]);

  // 4) reset pagination
  useEffect(() => {
    setPage(1);
  }, [tab, viewMode, sortConfig, search]);

  // filtered by tab
  const byTab = useMemo(
    () => (tab === "전체" ? data : data.filter((s) => s.category === tab)),
    [data, tab],
  );

  // prioritize or filter favorites
  const byView = useMemo(() => {
    if (viewMode === "즐겨찾기") {
      return byTab.filter((s) => favorites.includes(s.id));
    }
    return [...byTab].sort((a, b) =>
      favorites.includes(a.id) === favorites.includes(b.id) ? 0 : favorites.includes(a.id) ? -1 : 1,
    );
  }, [byTab, viewMode, favorites]);

  // sorting vs search
  const sorted = useMemo(() => {
    if (search.trim()) return byView;
    const mult = sortConfig.dir === "asc" ? 1 : -1;
    return [...byView].sort((a, b) =>
      sortConfig.key === "name"
        ? a.name.localeCompare(b.name) * mult
        : ((a as any)[sortConfig.key] - (b as any)[sortConfig.key]) * mult,
    );
  }, [byView, sortConfig, search]);

  // fuzzy-search if needed
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

  // infinite scroll
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

  // toggle favorite
  const toggleFav = async (id: number) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    const isFav = favorites.includes(id);
    try {
      if (isFav) {
        await removeFavorite(id);
        setFavorites((f) => f.filter((x) => x !== id));
      } else {
        await addFavorite(id);
        setFavorites((f) => [...f, id]);
      }
    } catch {
      alert("즐겨찾기 업데이트 실패");
    }
  };

  // sort handler
  const handleSort = (key: SortKey) => {
    if (search.trim()) return;
    setSortConfig((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" },
    );
  };

  // toggle 전체/즐겨찾기 view
  const toggleView = () => setViewMode((m) => (m === "전체" ? "즐겨찾기" : "전체"));

  // summary stats
  const summary = byTab;
  const total = summary.length || 1;
  const largeDown = summary.filter((s) => s.priceChange < -BIG_CHANGE).length;
  const smallDown = summary.filter((s) => s.priceChange < 0 && s.priceChange >= -BIG_CHANGE).length;
  const zero = summary.filter((s) => s.priceChange === 0).length;
  const smallUp = summary.filter((s) => s.priceChange > 0 && s.priceChange <= BIG_CHANGE).length;
  const largeUp = summary.filter((s) => s.priceChange > BIG_CHANGE).length;
  const upPct = ((smallUp + largeUp) / total) * 100;
  const downPct = ((smallDown + largeDown) / total) * 100;
  const meanChange = summary.reduce((sum, s) => sum + s.priceChange, 0) / total;
  const variance = summary.reduce((sum, s) => sum + (s.priceChange - meanChange) ** 2, 0) / total;
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

  if (loading) {
    return <MarketSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <section className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        {/* Nav tabs: 왼쪽 정렬 */}
        <nav className="overflow-x-auto flex justify-start">
          <ul className="flex space-x-6 border-b border-gray-700">
            <li>
              <button
                onClick={toggleView}
                className={`px-4 py-2 -mb-px cursor-pointer transition-colors ${
                  viewMode === "즐겨찾기"
                    ? "text-yellow-400 border-b-2 border-yellow-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Icons name="banana" className="w-5 h-5" />
              </button>
            </li>
            {(["전체", "국내", "해외", "암호화폐"] as const).map((t) => (
              <li key={t}>
                <button
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 -mb-px text-sm font-medium cursor-pointer transition-colors ${
                    tab === t
                      ? "text-white border-b-2 border-blue-500"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {t}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Left list */}
          <div className="w-full md:w-2/3 space-y-2">
            <div className="flex items-center px-4 py-2 bg-gray-800 rounded-lg">
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
                  className={`flex items-center px-4 py-2 rounded-lg border-2 ${border} transition-colors duration-500 ease-in-out cursor-pointer hover:bg-gray-700 hover:scale-[1.003]`}
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
                    {s.currentPrice > 0 ? `${s.currentPrice.toLocaleString()} 원` : "N/A"}
                  </div>

                  <div
                    className={`w-20 text-right font-semibold ml-2 ${
                      s.priceChange > 0
                        ? "text-green-400"
                        : s.priceChange < 0
                          ? "text-red-400"
                          : "text-gray-400"
                    }`}
                  >
                    {formatPercentage(s.priceChange)}
                  </div>

                  <div className="w-36 text-right text-gray-200 ml-2">
                    {s.marketCap > 0 ? formatCurrency(s.marketCap) : "N/A"}
                  </div>
                </div>
              );
            })}

            {visible.length < finalList.length && <div ref={loadMoreRef} className="h-2" />}
          </div>

          {/* Right sidebar */}
          <div className="w-full md:w-1/3">
            <MarketSidebar
              search={search}
              onSearchChange={setSearch}
              statusTitle={statusTitle}
              largeUp={largeUp}
              smallUp={smallUp}
              zero={zero}
              smallDown={smallDown}
              largeDown={largeDown}
              upPct={upPct}
              downPct={downPct}
              volatility={volatility}
              topGainers={topGainers}
              topLosers={topLosers}
              onMomentumClick={(id) =>
                navigate(`/asset/${id}`, {
                  state: { asset: summary.find((s) => s.id === id)! },
                })
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Market;
