// /frontend/src/components/FavoriteAssetsWidget.tsx
import React, { useEffect, useState, useContext } from "react";
import { fetchAssets } from "../services/assetService";
import { fetchFavorites } from "../services/favoriteService";
import { AuthContext } from "../providers/AuthProvider";
import { useNavigate } from "react-router-dom";

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
const marketToCategory = (market: string): Category => {
  if (["KOSPI", "KOSDAQ", "KRX"].includes(market)) return "국내";
  if (["NASDAQ", "NYSE", "AMEX"].includes(market)) return "해외";
  if (["Binance", "Upbit"].includes(market)) return "암호화폐";
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

const MAX_PER_CAT = 3;
const MAX_TOTAL_FAV = 9;

const FavoriteAssetsWidget: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
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
        setFavoriteIds(favIds as number[]);
      })
      .catch(() => setErr("데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [user]);

  // 분류 함수
  function getDisplayList(): { cat: Category; items: Asset[] }[] {
    if (assets.length === 0) return [];

    if (user && favoriteIds.length > 0) {
      // 즐겨찾기 종목만
      const favs = assets
        .filter((a) => favoriteIds.includes(a.id))
        .sort((a, b) => b.marketCap - a.marketCap)
        .slice(0, MAX_TOTAL_FAV);

      // 카테고리별 그룹화
      return CATEGORY_ORDER.map((cat) => ({
        cat,
        items: favs.filter((a) => marketToCategory(a.market) === cat),
      })).filter((group) => group.items.length > 0);
    } else {
      // 비로그인(또는 즐겨찾기 없음): 각 카테고리별 시총 상위 N개
      return CATEGORY_ORDER.map((cat) => ({
        cat,
        items: assets
          .filter((a) => marketToCategory(a.market) === cat)
          .sort((a, b) => b.marketCap - a.marketCap)
          .slice(0, MAX_PER_CAT),
      }));
    }
  }

  const list = getDisplayList();

  if (loading)
    return (
      <div className="bg-gray-800 rounded-lg p-6 mt-6 shadow text-gray-400">
        관심종목 불러오는 중…
      </div>
    );
  if (err)
    return (
      <div className="bg-gray-800 rounded-lg p-6 mt-6 shadow text-red-400">{err}</div>
    );

  return (
    <div className="bg-gray-800 rounded-lg p-6 mt-6 shadow">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        내 관심종목
      </h3>
      {list.length === 0 ? (
        <div className="text-gray-400">표시할 종목이 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {list.map(({ cat, items }) => (
            <div key={cat}>
              <div className={`mb-1 text-sm font-bold ${COLOR[cat]}`}>{LABEL[cat]}</div>
              <ul className="divide-y divide-gray-700">
                {items.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center py-2 cursor-pointer hover:bg-gray-700 rounded px-2 transition"
                    onClick={() => navigate(`/asset/${a.id}`)}
                  >
                    <span className="flex-1 text-white font-semibold truncate">{a.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{a.symbol}</span>
                    <span className="ml-3 font-bold text-white">
                      {a.currentPrice ? a.currentPrice.toLocaleString() : "-"}
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
                      {(a.priceChange ?? 0).toFixed(2)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {/* 즐겨찾기 없을 때는 안내 */}
      {user && favoriteIds.length === 0 && (
        <div className="text-gray-400 text-xs mt-4">
          아직 즐겨찾기한 종목이 없습니다.  
          <span
            className="underline cursor-pointer ml-1"
            onClick={() => navigate("/market")}
          >
            마켓에서 추가해보세요!
          </span>
        </div>
      )}
    </div>
  );
};

export default FavoriteAssetsWidget;
