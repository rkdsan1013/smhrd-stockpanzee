// /frontend/src/components/NewsCard.tsx
import React, { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Icons from "./Icons";
import type { NewsItem } from "../services/newsService";
import type { Asset } from "../services/assetService";
import { AssetContext } from "../providers/AssetProvider";

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

function getCategoryLabel(key: string) {
  return CATEGORY_LABELS[key] ?? "기타";
}

function getSentiment(v: number | string | null) {
  const idx = Math.min(4, Math.max(0, Number(v) - 1 || 2));
  return {
    label: SENT_LABELS[idx],
    color: idx <= 1 ? "bg-red-600" : idx === 2 ? "bg-gray-600" : "bg-green-600",
    iconName: idx <= 1 ? "arrowDown" : idx === 2 ? "minus" : "arrowUp",
  };
}

function marketCategory(m: string): NewsItem["category"] {
  const mm = m.toUpperCase();
  if (mm === "KOSPI" || mm === "KOSDAQ") return "domestic";
  if (mm === "NASDAQ" || mm === "NYSE") return "international";
  if (mm.includes("BINANCE")) return "crypto";
  return "international";
}

const NewsCard: React.FC<NewsCardProps> = ({ variant = "default", newsItem }) => {
  const { staticAssets, ready } = useContext(AssetContext);
  const navigate = useNavigate();

  // symbol → Asset[] 맵 생성
  const assetDict = useMemo<Record<string, Asset[]>>(() => {
    const dict: Record<string, Asset[]> = {};
    staticAssets.forEach((a) => {
      const key = a.symbol.toUpperCase();
      if (!dict[key]) dict[key] = [];
      dict[key].push(a);
    });
    return dict;
  }, [staticAssets]);

  // tagsRaw 파싱
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

  // pickAsset: 뉴스 카테고리와 동일한 마켓 우선으로 매칭
  const pickAsset = (symRaw: string, targetCategory: NewsItem["category"]): Asset | null => {
    const up = symRaw.toUpperCase();
    const cands = assetDict[up] || [];
    if (!cands.length) return null;

    const matched = cands.filter((a) => marketCategory(a.market) === targetCategory);
    return matched.length ? matched[0] : cands[0];
  };

  // assetTags: 각 심볼당 하나의 자산만
  const assetTags = useMemo<Asset[]>(() => {
    if (!ready) return [];
    return tagsRaw
      .map((sym) => pickAsset(sym, newsItem.category))
      .filter((a): a is Asset => Boolean(a));
  }, [ready, tagsRaw, assetDict, newsItem.category]);

  const categoryLabel = getCategoryLabel(newsItem.category);
  const sentiment = getSentiment(newsItem.sentiment);

  const handleCardClick = () => navigate(`/news/${newsItem.id}`);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => e.key === "Enter" && handleCardClick()}
      className="flex flex-col h-full bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:scale-[1.02] transition cursor-pointer"
      aria-label={newsItem.title_ko || newsItem.title}
    >
      {/* 이미지 */}
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

      {/* 본문 */}
      <div className={`flex flex-col flex-1 ${variant === "compact" ? "p-4" : "p-6"}`}>
        {/* 카테고리 & 감정 배지 */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-2 py-1 bg-gray-700 text-xs font-semibold rounded-full">
            {categoryLabel}
          </span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${sentiment.color}`}>
            {sentiment.label}
          </span>
        </div>

        {/* 자산 태그 */}
        {assetTags.length > 0 && variant !== "compact" && (
          <div className="flex flex-wrap gap-2 mb-3">
            {assetTags.map(({ id, name, symbol }) => (
              <button
                key={symbol}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/asset/${id}`);
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
