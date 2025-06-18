// /frontend/src/pages/News.tsx
import React, { useState, useEffect } from "react";
import type { NewsItem } from "../services/newsService";
import { fetchNews } from "../services/newsService";

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

// 필터 탭 옵션: 내부 키는 API의 값, 화면에는 한글 라벨로 표시
const tabs: { key: "all" | "domestic" | "international" | "crypto"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "domestic", label: "국내" },
  { key: "international", label: "해외" },
  { key: "crypto", label: "암호화폐" },
];

const News: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedNewsTab, setSelectedNewsTab] = useState<
    "all" | "domestic" | "international" | "crypto"
  >("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNews = async () => {
    try {
      const data = await fetchNews();
      setNewsItems(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const filteredNews =
    selectedNewsTab === "all"
      ? newsItems
      : newsItems.filter((item) => item.category === selectedNewsTab);

  if (loading) {
    return <div className="p-6 text-white text-center">Loading news...</div>;
  }
  if (error) {
    return <div className="p-6 text-red-400 text-center">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 페이지 헤더 */}
      <h1 className="text-3xl font-bold text-white mb-6 text-center">최신 뉴스</h1>
      {/* 뉴스 필터 탭 */}
      <div className="mb-8 flex justify-center">
        <div className="bg-gray-800 px-4 py-2 rounded-full flex space-x-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedNewsTab(tab.key)}
              className={`px-4 py-2 rounded-full transition-colors duration-300 text-sm font-medium focus:outline-none ${
                selectedNewsTab === tab.key
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-blue-500 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {/* 뉴스 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredNews.map((item) => {
          // 태그 처리: 만약 이미 배열이면 그대로 사용, 문자열이면 JSON.parse 시도
          let tagsArray: string[] = [];
          if (Array.isArray(item.tags)) {
            tagsArray = item.tags;
          } else if (item.tags && typeof item.tags === "string" && item.tags.trim() !== "") {
            try {
              const parsed = JSON.parse(item.tags);
              if (Array.isArray(parsed)) {
                tagsArray = parsed;
              }
            } catch (e) {
              tagsArray = [];
            }
          }

          return (
            <div
              key={item.id}
              className="bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-all hover:scale-105"
            >
              {/* 이미지 영역 */}
              <div className="relative h-48">
                <img src={item.image} alt={item.title} className="object-cover w-full h-full" />
              </div>
              {/* 카드 본문 */}
              <div className="p-4">
                {/* 카테고리 및 감성 배지 */}
                <div className="flex items-center space-x-2 mb-3">
                  <span className="px-3 py-1 bg-gray-700 text-xs font-semibold rounded-full">
                    {getCategoryLabel(item.category)}
                  </span>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getSentimentBadgeStyles(item.sentiment)}`}
                  >
                    {getSentimentLabel(item.sentiment)}
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
                <h3 className="text-lg font-bold text-white mb-2">{item.title_ko || item.title}</h3>
                {/* 간결 요약 */}
                <p className="text-sm text-gray-300 mb-3">{item.brief_summary}</p>
                {/* 퍼블리셔 및 발행일 영역 (세로 배치) */}
                <div className="mt-4 space-y-1">
                  <div className="text-xs text-gray-400">{item.publisher}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(item.published_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default News;
