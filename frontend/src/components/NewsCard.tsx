// /frontend/src/components/NewsCard.tsx
import React from "react";
import { Link } from "react-router-dom";
import type { NewsItem } from "../services/newsService";

interface NewsCardProps {
  newsItem: NewsItem;
}

// 뉴스 카테고리 매핑: "domestic", "international", "crypto" → "국내", "해외", "암호화폐"
const getCategoryLabel = (category: "domestic" | "international" | "crypto"): string => {
  switch (category) {
    case "domestic":
      return "국내";
    case "international":
      return "해외";
    case "crypto":
      return "암호화폐";
    default:
      return category;
  }
};

// 감성 평점 라벨 매핑 (news_sentiment 사용)
const getSentimentLabel = (value: number | string | null): string => {
  const numericValue = Number(value) || 3;
  switch (numericValue) {
    case 1:
      return "매우 부정";
    case 2:
      return "부정";
    case 3:
      return "중립";
    case 4:
      return "긍정";
    case 5:
      return "매우 긍정";
    default:
      return "중립";
  }
};

// 감성 평점에 따른 배지 스타일
const getSentimentBadgeStyles = (value: number | string | null): string => {
  const numericValue = Number(value) || 3;
  if (numericValue <= 2) return "bg-red-600 text-white";
  if (numericValue === 3) return "bg-gray-600 text-white";
  if (numericValue >= 4) return "bg-green-600 text-white";
  return "bg-gray-600 text-white";
};

const NewsCard: React.FC<NewsCardProps> = ({ newsItem }) => {
  // 태그 처리: 배열이면 그대로 사용, 문자열이면 JSON.parse 시도
  let tagsArray: string[] = [];
  if (Array.isArray(newsItem.tags)) {
    tagsArray = newsItem.tags;
  } else if (newsItem.tags && typeof newsItem.tags === "string" && newsItem.tags.trim() !== "") {
    try {
      const parsed = JSON.parse(newsItem.tags);
      if (Array.isArray(parsed)) {
        tagsArray = parsed;
      }
    } catch (e) {
      tagsArray = [];
    }
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105">
      <Link to={`/news/${newsItem.id}`} className="block hover:no-underline">
      {/* 이미지 영역 */}
      <div className="relative h-48">
        <img src={newsItem.image} alt={newsItem.title} className="object-cover w-full h-full" />
      </div>
      {/* 카드 본문 */}
      <div className="p-4">
        {/* 카테고리 및 감성 배지 */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="px-3 py-1 bg-gray-700 text-xs font-semibold rounded-full">
            {getCategoryLabel(newsItem.category)}
          </span>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${getSentimentBadgeStyles(newsItem.sentiment)}`}
          >
            {getSentimentLabel(newsItem.sentiment)}
          </span>
        </div>
        {/* 관련 종목 태그 */}
        {tagsArray.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {tagsArray.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {/* 뉴스 제목 */}
        <h3 className="text-lg font-bold text-white mb-2">{newsItem.title_ko || newsItem.title}</h3>
        {/* 간결 요약 */}
        <p className="text-sm text-gray-300 mb-3">{newsItem.brief_summary}</p>
        {/* 퍼블리셔 및 발행일 영역 */}
        <div className="mt-4 space-y-1">
          <div className="text-xs text-gray-400">{newsItem.publisher}</div>
          <div className="text-xs text-gray-400">
            {new Date(newsItem.published_at).toLocaleString()}
          </div>
        </div>
      </div>
    </Link>
    </div>
  );
};

export default React.memo(NewsCard);