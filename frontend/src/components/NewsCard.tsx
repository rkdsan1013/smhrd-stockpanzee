// frontend/src/components/NewsCard.tsx
import React from "react";
import { Link } from "react-router-dom";
import type { NewsItem } from "../services/newsService";

export interface NewsCardProps {
  /** 렌더링 모드: default | compact | hero */
  variant?: "default" | "compact" | "hero";
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
  if (Array.isArray(newsItem.tags)) {
    tags = newsItem.tags as string[];
  } else if (typeof newsItem.tags === "string") {
    try {
      const p = JSON.parse(newsItem.tags);
      if (Array.isArray(p)) tags = p as string[];
    } catch {}
  }

  const sentiment = getSentiment(newsItem.sentiment);

  // HERO 모드
  if (variant === "hero") {
    return (
      <Link
        to={`/news/${newsItem.id}`}
        className="block bg-gray-800 rounded-lg overflow-hidden transform hover:scale-[1.02] shadow-lg transition"
      >
        <div className="relative w-full h-80">
          <img
            src={newsItem.image}
            alt={newsItem.title}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-gray-700 text-xs font-semibold rounded-full">
              {getCategoryLabel(newsItem.category)}
            </span>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${sentiment.style}`}>
              {sentiment.label}
            </span>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
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
          <h2 className="text-3xl font-bold text-white">{newsItem.title_ko || newsItem.title}</h2>
          <p className="text-gray-300 line-clamp-3">{newsItem.summary || newsItem.brief_summary}</p>
        </div>
      </Link>
    );
  }

  // COMPACT 모드: 이미지 없이 텍스트 리스트 스타일
  if (variant === "compact") {
    return (
      <Link
        to={`/news/${newsItem.id}`}
        className="block bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-semibold text-white line-clamp-2 flex-1">
            {newsItem.title_ko || newsItem.title}
          </h3>
          <span
            className={`ml-3 px-2 py-0.5 text-xs font-semibold rounded-full ${sentiment.style}`}
          >
            {sentiment.label}
          </span>
        </div>
        <div className="mt-1 flex items-center text-xs text-gray-400 space-x-2">
          <span>{new Date(newsItem.published_at).toLocaleDateString()}</span>
          <span>·</span>
          <span>{getCategoryLabel(newsItem.category)}</span>
        </div>
      </Link>
    );
  }

  // DEFAULT 모드
  return (
    <Link
      to={`/news/${newsItem.id}`}
      className="block bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:scale-[1.02] transition"
    >
      <div className="relative w-full h-48">
        <img
          src={newsItem.image}
          alt={newsItem.title}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-gray-700 text-xs font-semibold rounded-full">
            {getCategoryLabel(newsItem.category)}
          </span>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${sentiment.style}`}>
            {sentiment.label}
          </span>
        </div>
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
        <h3 className="text-lg font-bold text-white">{newsItem.title_ko || newsItem.title}</h3>
        <p className="text-sm text-gray-300 line-clamp-2">{newsItem.brief_summary}</p>
        <div className="mt-4 text-xs text-gray-400 space-y-1">
          <div>{newsItem.publisher}</div>
          <div>{new Date(newsItem.published_at).toLocaleString()}</div>
        </div>
      </div>
    </Link>
  );
};

export default React.memo(NewsCard);
