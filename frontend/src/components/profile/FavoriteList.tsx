// /frontend/src/components/profile/FavoriteList.tsx
import React, { useEffect, useState, useMemo } from "react";
import { fetchFavorites, removeFavorite } from "../../services/favoriteService";
import { fetchAssets } from "../../services/assetService";
import type { Asset } from "../../services/assetService";
import { useNavigate } from "react-router-dom";
import Icons from "../Icons";

const CATEGORY_TABS = ["전체", "국내", "해외", "암호화폐"] as const;
type CategoryTab = (typeof CATEGORY_TABS)[number];

function marketToCategory(market: string): CategoryTab | "기타" {
  if (["KOSPI", "KOSDAQ"].includes(market)) return "국내";
  if (["NASDAQ", "NYSE", "AMEX"].includes(market)) return "해외";
  if (market === "Binance") return "암호화폐";
  return "기타";
}

const FavoriteList: React.FC = () => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<CategoryTab>("전체");
  const navigate = useNavigate();

  // 최초 한번 즐겨찾기+전체자산 동시 로딩
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchFavorites(), fetchAssets()])
      .then(([favIds, allAssets]) => {
        setFavorites(favIds);
        setAssets(allAssets);
      })
      .catch(() => setError("즐겨찾기 또는 자산 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // 즐겨찾기 삭제
  const handleRemove = async (id: number) => {
    if (!window.confirm("즐겨찾기에서 삭제하시겠습니까?")) return;
    try {
      await removeFavorite(id);
      setFavorites((prev) => prev.filter((fid) => fid !== id));
    } catch {
      alert("삭제 실패. 다시 시도해주세요.");
    }
  };

  const handleClick = (id: number) => {
    navigate(`/asset/${id}`);
  };

  // 필터링된 즐겨찾기 자산
  const filteredAssets = useMemo(() => {
    const favAssets = assets.filter((a) => favorites.includes(a.id));
    if (category === "전체") return favAssets;
    return favAssets.filter((a) => marketToCategory(a.market) === category);
  }, [favorites, assets, category]);

  // 로딩 및 에러 UI
  if (loading) return <div className="text-gray-400 py-4">즐겨찾기 로딩 중...</div>;
  if (error) return <div className="text-red-400 py-4">{error}</div>;

  return (
    <div>
      {/* 항상 표시되는 카테고리 탭 */}
      <div className="flex mb-4 space-x-2">
        {CATEGORY_TABS.map((cat) => (
          <button
            key={cat}
            className={`px-4 py-2 rounded-full font-semibold text-sm ${
              category === cat
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-blue-500 hover:text-white"
            }`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 필터링 결과가 없을 때만 메시지 */}
      {filteredAssets.length === 0 ? (
        <div className="text-gray-400 py-4">즐겨찾기 종목이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between bg-gray-800 rounded p-4 hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => handleClick(a.id)}
            >
              <div>
                <span className="text-white font-semibold">{a.name}</span>
                <span className="text-xs text-gray-400 ml-2">{a.symbol}</span>
              </div>
              <button
                className="ml-3 text-red-400 hover:text-red-600 text-base p-1 rounded transition"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(a.id);
                }}
                title="즐겨찾기 해제"
              >
                <Icons name="close" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoriteList;
