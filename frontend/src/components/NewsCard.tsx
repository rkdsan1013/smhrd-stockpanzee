// frontend/src/components/NewsCard.tsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Icons from "../components/Icons";
import type { NewsItem } from "../services/newsService";
import { fetchAssets, getAssetDictSync, type Asset } from "../services/assetService";

export interface NewsCardProps {
  variant?: "hero" | "default" | "compact";
  newsItem: NewsItem;
}

const CATEGORY_LABELS: Record<string, string> = {
  domestic: "국내",
  international: "해외",
  crypto: "암호화폐",
};

const SENT_LABELS = ["매우 부정", "부정", "중립", "긍정", "매우 긍정"] as const;
const SENT_ICONS = ["arrowDown", "arrowDown", "minus", "arrowUp", "arrowUp"] as const;

function getCategoryLabel(key: string) {
  return CATEGORY_LABELS[key] ?? "기타";
}
function getSentiment(v: number | string | null) {
  const idx = Math.min(4, Math.max(0, Number(v) - 1 || 2));
  return {
    label: SENT_LABELS[idx],
    iconName: SENT_ICONS[idx],
    color: idx <= 1 ? "bg-red-600" : idx === 2 ? "bg-gray-600" : "bg-green-600",
  };
}

const NewsCard: React.FC<NewsCardProps> = ({ variant = "default", newsItem }) => {
  /* ───── 자산 딕셔너리 동기 + 필요 시 비동기 로드 ───── */
  const dictRef = useRef<Record<string, Asset>>(getAssetDictSync());
  const [ready, setReady] = useState<boolean>(Object.keys(dictRef.current).length > 0);

  useEffect(() => {
    if (!ready) {
      fetchAssets().then(() => {
        dictRef.current = getAssetDictSync();
        setReady(true);
      });
    }
  }, [ready]);

  /* ───── 태그 파싱 + 매핑 ───── */
  const tagsRaw = useMemo<string[]>(() => {
    if (Array.isArray(newsItem.tags)) return newsItem.tags;
    if (typeof newsItem.tags === "string") {
      try {
        const p = JSON.parse(newsItem.tags);
        return Array.isArray(p) ? p : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [newsItem.tags]);

  const assetTags = useMemo(
    () => (ready ? (tagsRaw.map((s) => dictRef.current[s]).filter(Boolean) as Asset[]) : []),
    [ready, tagsRaw],
  );

  /* ───── 네비게이션 ───── */
  const navigate = useNavigate();
  const handleCardClick = () => navigate(`/news/${newsItem.id}`);

  /* ───── 기타 데이터 ───── */
  const categoryLabel = getCategoryLabel(newsItem.category);
  const sentiment = getSentiment(newsItem.sentiment);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      className="flex flex-col h-full bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:scale-[1.02] transition cursor-pointer"
      aria-label={newsItem.title_ko || newsItem.title}
    >
      {/* 이미지 (hero, default) */}
      {variant !== "compact" && (
        <div className={`relative w-full ${variant === "hero" ? "h-80" : "h-48"}`}>
          <img
            src={newsItem.image || "/panzee.webp"}
            alt={newsItem.title}
            className="absolute inset-0 w-full h-full object-cover object-center"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/panzee.webp";
            }}
          />
        </div>
      )}

      <div className={`flex flex-col flex-1 ${variant === "compact" ? "p-4" : "p-6"}`}>
        {/* 배지 */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2 py-1 bg-gray-700 text-xs font-semibold rounded-full">
            {categoryLabel}
          </span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${sentiment.color}`}>
            {sentiment.label}
          </span>
        </div>

        {/* 회사명 태그 */}
        {assetTags.length > 0 && variant !== "compact" && (
          <div className="flex flex-wrap gap-2 mb-3">
            {assetTags.map(({ id, name, symbol }) => (
              <button
                key={symbol}
                type="button"
                onClick={(e) => {
                  e.stopPropagation(); // 카드 클릭 무시
                  navigate(`/asset/${id}`); // AssetDetail 이동
                }}
                className="px-2 py-1 bg-blue-600 text-xs font-semibold rounded-full hover:bg-blue-500 transition"
              >
                {name}
              </button>
            ))}
          </div>
        )}

        {/* 제목 / 요약 */}
        {variant === "compact" ? (
          <>
            <h3 className="text-white font-semibold text-base line-clamp-2">
              {newsItem.title_ko || newsItem.title}
            </h3>
            <p className="mt-1 text-gray-300 text-sm line-clamp-2">
              {newsItem.brief_summary || newsItem.summary}
            </p>
          </>
        ) : (
          <>
            <h3
              className={`text-white font-bold mb-2 line-clamp-2 ${
                variant === "hero" ? "text-3xl" : "text-lg"
              }`}
            >
              {newsItem.title_ko || newsItem.title}
            </h3>
            <p className="text-gray-300 text-sm flex-1 line-clamp-3">
              {newsItem.brief_summary || newsItem.summary}
            </p>
          </>
        )}

        {/* 푸터 */}
        <div className="mt-auto pt-4 flex justify-between items-center text-xs text-gray-400">
          <div className="space-y-1">
            <div>{newsItem.publisher}</div>
            <div>{new Date(newsItem.published_at).toLocaleString()}</div>
          </div>
          <div className="flex items-center space-x-1">
            <Icons name="eyeOpen" className="w-4 h-4" />
            <span className="text-sm">{(newsItem.view_count ?? 0).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(NewsCard);
