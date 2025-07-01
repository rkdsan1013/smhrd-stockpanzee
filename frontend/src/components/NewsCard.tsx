// frontend/src/components/NewsCard.tsx

import React from "react";
import { Link } from "react-router-dom";
import type { NewsItem } from "../services/newsService";

export interface NewsCardProps {
  /** "hero" | "default" | "compact" */
  variant?: "hero" | "default" | "compact";
  newsItem: NewsItem;
}

const getCategoryLabel = (c: "domestic" | "international" | "crypto") =>
  c === "domestic" ? "국내" : c === "international" ? "해외" : "암호화폐";

const SENT_LABELS = ["매우 부정", "부정", "중립", "긍정", "매우 긍정"];
const getSentiment = (v: number | string | null): { label: string; style: string } => {
  const x = Math.min(5, Math.max(1, Number(v) || 3));
  return {
    label: SENT_LABELS[x - 1],
    style:
      x <= 2
        ? "bg-red-600 text-white"
        : x === 3
          ? "bg-gray-600 text-white"
          : "bg-green-600 text-white",
  };
};

const NewsCard: React.FC<NewsCardProps> = ({ newsItem, variant = "default" }) => {
  // tags 배열화
  let tags: string[] = [];
  if (Array.isArray(newsItem.tags)) tags = newsItem.tags as string[];
  else if (typeof newsItem.tags === "string") {
    try {
      const p = JSON.parse(newsItem.tags);
      if (Array.isArray(p)) tags = p as string[];
    } catch {}
  }
  //console.log("🟦 NewsCard tags:", tags, "newsItem:", newsItem);
  const sentiment = getSentiment(newsItem.sentiment);
  const categoryLabel = getCategoryLabel(newsItem.category);

  // 이미지 높이 & 제목 크기
  const imgHeight = variant === "hero" ? "h-80" : variant === "default" ? "h-48" : "";
  const titleSize =
    variant === "hero" ? "text-3xl" : variant === "default" ? "text-lg" : "text-base";

  // COMPACT 모드
  if (variant === "compact") {
    return (
      <Link
        to={`/news/${newsItem.id}`}
        className="flex flex-col bg-gray-800 rounded-lg overflow-hidden transform hover:scale-[1.02] transition"
      >
        <div className="p-4 flex-1 flex flex-col justify-between">
          {/* 상단: 배지 + 제목 */}
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-1 bg-gray-700 text-xs font-semibold rounded-full">
                {categoryLabel}
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${sentiment.style}`}>
                {sentiment.label}
              </span>
            </div>
            <h3 className="font-semibold text-white line-clamp-2">
              {newsItem.title_ko || newsItem.title}
            </h3>
          </div>
          {/* 하단: 퍼블리셔 · 날짜 */}
          <div className="mt-4 text-xs text-gray-400 space-y-1">
            <div>{newsItem.publisher}</div>
            <div>{new Date(newsItem.published_at).toLocaleString()}</div>
          </div>
        </div>
      </Link>
    );
  }

  // HERO / DEFAULT 모드
  return (
    <Link
      to={`/news/${newsItem.id}`}
      className="flex flex-col bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-[1.02] transition"
    >
      {/* 이미지 */}
      <div className={`relative w-full ${imgHeight}`}>
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

      {/* 내용 */}
      <div className="flex flex-col flex-1 p-6">
        <div className="space-y-3">
          {/* 배지 */}
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-gray-700 text-xs font-semibold rounded-full">
              {categoryLabel}
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${sentiment.style}`}>
              {sentiment.label}
            </span>
          </div>

          {/* 종목 태그 */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* 제목 */}
          <h3 className={`font-bold text-white ${titleSize}`}>
            {newsItem.title_ko || newsItem.title}
          </h3>

          {/* 요약 */}
          <p className="text-sm text-gray-300 line-clamp-2">
            {newsItem.brief_summary || newsItem.summary}
          </p>
        </div>

        {/* 하단: 퍼블리셔 · 작성일 */}
        <div className="mt-auto pt-4 text-xs text-gray-400 space-y-1">
          <div>{newsItem.publisher}</div>
          <div>{new Date(newsItem.published_at).toLocaleString()}</div>
        </div>
      </div>
    </Link>
  );
};

export default React.memo(NewsCard);
