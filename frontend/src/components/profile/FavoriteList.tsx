// /frontend/src/components/profile/FavoriteList.tsx
import React, { useEffect, useState, useMemo } from "react";
import { fetchFavorites, addFavorite, removeFavorite } from "../../services/favoriteService";
import { fetchAssets } from "../../services/assetService";
import type { Asset } from "../../services/assetService";
import { useNavigate } from "react-router-dom";
import Icons from "../Icons";

// 카테고리 탭
const CATEGORY_TABS = ["전체", "국내", "해외", "암호화폐"] as const;
type CategoryTab = (typeof CATEGORY_TABS)[number];

function marketToCategory(market: string): CategoryTab | "기타" {
  if (["KOSPI", "KOSDAQ"].includes(market)) return "국내";
  if (["NASDAQ", "NYSE"].includes(market)) return "해외";
  if (market === "Binance") return "암호화폐";
  return "기타";
}

const FavoriteList: React.FC = () => {
  const [originFavorites, setOriginFavorites] = useState<number[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<CategoryTab>("전체");
  const [localFavorites, setLocalFavorites] = useState<Set<number>>(new Set());
  const [touched, setTouched] = useState(false);
  const navigate = useNavigate();

  // 최초 로딩
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchFavorites(), fetchAssets()])
      .then(([favIds, allAssets]) => {
        setOriginFavorites(favIds);
        setLocalFavorites(new Set(favIds));
        setAssets(allAssets);
      })
      .catch(() => setError("즐겨찾기 또는 자산 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // 언마운트 시 변경 반영
  useEffect(() => {
    const handleLeave = async () => {
      if (!touched) return;
      const addList = Array.from(localFavorites).filter((id) => !originFavorites.includes(id));
      const removeList = originFavorites.filter((id) => !localFavorites.has(id));
      await Promise.all([
        ...addList.map((id) => addFavorite(id)),
        ...removeList.map((id) => removeFavorite(id)),
      ]);
    };
    window.addEventListener("beforeunload", handleLeave);
    return () => {
      handleLeave();
      window.removeEventListener("beforeunload", handleLeave);
    };
  }, [originFavorites, localFavorites, touched]);

  // 즐겨찾기 & 카테고리 필터링 + 시가총액 내림차순 정렬
  const filteredAssets = useMemo(() => {
    let favAssets = assets.filter((a) => localFavorites.has(a.id));
    if (category !== "전체") {
      favAssets = favAssets.filter((a) => marketToCategory(a.market) === category);
    }
    return favAssets.sort((a, b) => b.marketCap - a.marketCap);
  }, [assets, localFavorites, category]);

  // 즐겨찾기 토글
  const handleBananaClick = (assetId: number) => {
    if (localFavorites.has(assetId)) {
      if (!window.confirm("정말로 즐겨찾기에서 삭제하시겠습니까?")) return;
    }
    setTouched(true);
    setLocalFavorites((prev) => {
      const next = new Set(prev);
      next.has(assetId) ? next.delete(assetId) : next.add(assetId);
      return next;
    });
  };

  // 상세 이동
  const handleClick = (id: number) => {
    navigate(`/asset/${id}`);
  };

  if (loading) return <div className="text-gray-400 py-4">즐겨찾기 로딩 중...</div>;
  if (error) return <div className="text-red-400 py-4">{error}</div>;

  return (
    <div>
      {/* 카테고리 탭 */}
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

      {/* 즐겨찾기 리스트 (시가총액 내림차순) */}
      {filteredAssets.length === 0 ? (
        <div className="text-gray-400 py-4">즐겨찾기 종목이 없습니다.</div>
      ) : (
        <ul className="space-y-4">
          {filteredAssets.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between bg-gray-800 rounded p-4 hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => handleClick(a.id)}
            >
              <button
                className="mr-4"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBananaClick(a.id);
                }}
                title={localFavorites.has(a.id) ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                <Icons
                  name="banana"
                  className={`w-6 h-6 transition-all ${
                    localFavorites.has(a.id) ? "text-yellow-400" : "text-gray-400"
                  }`}
                />
              </button>

              <div className="flex-1 min-w-0">
                <span className="text-white font-semibold">{a.name}</span>
                <span className="text-xs text-gray-400 ml-2">{a.symbol}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FavoriteList;
