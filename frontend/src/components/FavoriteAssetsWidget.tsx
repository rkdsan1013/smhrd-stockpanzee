// /frontend/src/components/FavoriteAssetsWidget.tsx
import React, { useEffect, useState, useContext } from "react";
import { fetchAssets } from "../services/assetService";
import { fetchFavorites, addFavorite, removeFavorite } from "../services/favoriteService";
import { AuthContext } from "../providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import Icons from "./Icons";

type Asset = {
  id: number;
  name: string;
  symbol: string;
  market: string;
  currentPrice: number;
  priceChange: number;
  marketCap: number;
};

type Category = "국내" | "해외" | "암호화폐" | "기타";

const marketToCategory = (m: string): Category => {
  if (["KOSPI", "KOSDAQ", "KRX"].includes(m)) return "국내";
  if (["NASDAQ", "NYSE", "AMEX"].includes(m)) return "해외";
  if (["Binance", "Upbit"].includes(m)) return "암호화폐";
  return "기타";
};

const CATEGORY_ORDER: Category[] = ["국내", "해외", "암호화폐"];
const LABEL: Record<Category, string> = {
  국내: "한국",
  해외: "해외",
  암호화폐: "암호화폐",
  기타: "기타",
};
const COLOR: Record<Category, string> = {
  국내: "text-blue-300",
  해외: "text-purple-300",
  암호화폐: "text-yellow-300",
  기타: "text-gray-300",
};

const FavoriteAssetsWidget: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAssets().catch(() => []),
      user ? fetchFavorites().catch(() => []) : Promise.resolve([]),
    ])
      .then(([allAssets, favIds]) => {
        setAssets(allAssets as Asset[]);
        setFavorites(favIds as number[]);
      })
      .catch(() => setErr("데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [user]);

  const toggleFavorite = async (assetId: number) => {
    const isFav = favorites.includes(assetId);
    setFavorites((prev) => (isFav ? prev.filter((id) => id !== assetId) : [...prev, assetId]));
    try {
      if (isFav) {
        await removeFavorite(assetId);
      } else {
        await addFavorite(assetId);
      }
    } catch {
      // rollback
      setFavorites((prev) => (isFav ? [...prev, assetId] : prev.filter((id) => id !== assetId)));
    }
  };

  function getDisplayList(): { cat: Category; items: Asset[] }[] {
    if (!assets.length) return [];

    if (user && favorites.length) {
      const favAssets = assets
        .filter((a) => favorites.includes(a.id))
        .sort((a, b) => b.marketCap - a.marketCap);
      return CATEGORY_ORDER.map((cat) => ({
        cat,
        items: favAssets.filter((a) => marketToCategory(a.market) === cat),
      })).filter((grp) => grp.items.length);
    }

    return CATEGORY_ORDER.map((cat) => ({
      cat,
      items: assets
        .filter((a) => marketToCategory(a.market) === cat)
        .sort((a, b) => b.marketCap - a.marketCap)
        .slice(0, 3),
    }));
  }

  const list = getDisplayList();

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 mt-6 shadow text-gray-400">
        관심종목 불러오는 중…
      </div>
    );
  }
  if (err) {
    return <div className="bg-gray-800 rounded-lg p-6 mt-6 shadow text-red-400">{err}</div>;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 mt-6 shadow">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">내 관심종목</h3>

      {list.length === 0 ? (
        <div className="text-gray-400">표시할 종목이 없습니다.</div>
      ) : (
        <div className="space-y-6">
          {list.map(({ cat, items }) => (
            <div key={cat}>
              <div className={`mb-2 text-sm font-bold ${COLOR[cat]}`}>{LABEL[cat]}</div>

              <ul className="divide-y divide-gray-700 max-h-40 overflow-y-auto no-scrollbar">
                {items.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center py-2 px-2 rounded hover:bg-gray-700 transition"
                  >
                    <button className="flex-shrink-0 mr-3" onClick={() => toggleFavorite(a.id)}>
                      <Icons
                        name="banana"
                        className={`w-5 h-5 ${
                          favorites.includes(a.id) ? "text-yellow-400" : "text-gray-500"
                        }`}
                      />
                    </button>

                    <div
                      className="flex-1 flex items-baseline space-x-1 cursor-pointer"
                      onClick={() => navigate(`/asset/${a.id}`)}
                    >
                      <span className="text-white font-semibold truncate">{a.name}</span>
                      <span className="text-xs text-gray-400">{a.symbol}</span>
                    </div>

                    <span className="ml-4 font-bold text-white">
                      {a.currentPrice?.toLocaleString() || "-"}
                    </span>

                    <span
                      className={`ml-2 font-semibold text-sm ${
                        a.priceChange > 0
                          ? "text-green-400"
                          : a.priceChange < 0
                            ? "text-red-400"
                            : "text-gray-400"
                      }`}
                    >
                      {a.priceChange > 0 && "+"}
                      {a.priceChange.toFixed(2)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {user && !favorites.length && (
        <div className="text-gray-400 text-xs mt-4">
          아직 즐겨찾기한 종목이 없습니다.
          <span className="underline cursor-pointer ml-1" onClick={() => navigate("/market")}>
            마켓에서 추가해보세요!
          </span>
        </div>
      )}
    </div>
  );
};

export default FavoriteAssetsWidget;
