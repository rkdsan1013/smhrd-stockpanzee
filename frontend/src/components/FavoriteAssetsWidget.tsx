// /frontend/src/components/FavoriteAssetsWidget.tsx
import React, { useEffect, useState, useContext } from "react";
import {
  fetchAssets,
  type Asset as MetaAsset,
  fetchAssetPrices,
  type AssetPrice,
} from "../services/assetService";
import { fetchFavorites, addFavorite, removeFavorite } from "../services/favoriteService";
import { AuthContext } from "../providers/AuthProvider";
import { useNavigate } from "react-router-dom";
import Icons from "./Icons";

type Category = "국내" | "해외" | "암호화폐" | "기타";

const marketToCategory = (m: string): Category => {
  if (["KOSPI", "KOSDAQ"].includes(m)) return "국내";
  if (["NASDAQ", "NYSE"].includes(m)) return "해외";
  if (["Binance"].includes(m)) return "암호화폐";
  return "기타";
};

const CATEGORY_ORDER: Category[] = ["국내", "해외", "암호화폐"];
const LABEL: Record<Category, string> = {
  국내: "국내",
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
  const [assets, setAssets] = useState<MetaAsset[]>([]);
  const [prices, setPrices] = useState<Record<number, AssetPrice>>({});
  const [favorites, setFavorites] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    const load = async () => {
      setLoading(true);
      setErr("");
      try {
        // 1) 메타데이터
        const metas = await fetchAssets();
        if (!alive) return;
        setAssets(metas);

        // 2) 가격 정보
        const priceList = await fetchAssetPrices();
        if (!alive) return;
        const priceMap: Record<number, AssetPrice> = {};
        priceList.forEach((p) => {
          priceMap[p.id] = p;
        });
        setPrices(priceMap);

        // 3) 즐겨찾기
        if (user) {
          const favIds = await fetchFavorites();
          if (!alive) return;
          setFavorites(favIds);
        } else {
          setFavorites([]);
        }
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setErr("데이터를 불러오지 못했습니다.");
        setAssets([]);
        setPrices({});
        setFavorites([]);
      } finally {
        alive && setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [user]);

  const toggleFavorite = async (assetId: number) => {
    const isFav = favorites.includes(assetId);
    // Optimistic update
    setFavorites((prev) => (isFav ? prev.filter((id) => id !== assetId) : [...prev, assetId]));
    try {
      if (isFav) {
        await removeFavorite(assetId);
      } else {
        await addFavorite(assetId);
      }
    } catch (e) {
      console.error(e);
      // Rollback
      setFavorites((prev) => (isFav ? [...prev, assetId] : prev.filter((id) => id !== assetId)));
    }
  };

  // 즐겨찾기 자산 & 가격 병합
  const favAssets = assets
    .filter((a) => favorites.includes(a.id))
    .map((a) => ({
      ...a,
      currentPrice: prices[a.id]?.currentPrice ?? 0,
      priceChange: prices[a.id]?.priceChange ?? 0,
    }));

  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: favAssets.filter((a) => marketToCategory(a.market) === cat),
  })).filter((g) => g.items.length > 0);

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

      {grouped.length === 0 ? (
        user ? (
          <div className="text-gray-400 text-center py-8">아직 즐겨찾기한 종목이 없습니다.</div>
        ) : (
          <div className="text-gray-400 text-center py-8">
            관심종목을 보려면{" "}
            <button className="underline" onClick={() => navigate("/auth/login")}>
              로그인
            </button>{" "}
            해주세요.
          </div>
        )
      ) : (
        <div className="space-y-6">
          {grouped.map(({ cat, items }) => (
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
                      className="flex-1 cursor-pointer"
                      onClick={() => navigate(`/asset/${a.id}`)}
                    >
                      <p className="text-white font-semibold truncate">{a.name}</p>
                      <p className="text-gray-400 text-xs">{a.symbol}</p>
                    </div>

                    <span className="ml-4 font-bold text-white">
                      {a.currentPrice.toLocaleString() || "-"}
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
    </div>
  );
};

export default React.memo(FavoriteAssetsWidget);
