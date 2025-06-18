// /frontend/src/pages/News.tsx
import React, { useState, useEffect } from "react";
import type { NewsItem } from "../services/newsService";
import { fetchNews } from "../services/newsService";

// 뉴스 카테고리를 한글로 매핑
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

// 감성 평점을 숫자로 변환한 후 라벨 매핑 (news_sentiment 사용)
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
  if (numericValue <= 2) return "bg-red-700 text-white";
  if (numericValue === 3) return "bg-gray-700 text-white";
  if (numericValue >= 4) return "bg-green-700 text-white";
  return "bg-gray-700 text-white";
};

// 필터 탭 옵션 (내부 키는 API의 값, 화면에는 한글 라벨로 매핑)
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

  if (loading) return <div className="p-6 text-white">Loading news...</div>;
  if (error) return <div className="p-6 text-red-400">Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      {/* 뉴스 필터 탭 */}
      <div className="flex justify-end mb-4">
        <div className="flex bg-gray-800 p-1 rounded-full border border-gray-600 space-x-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedNewsTab(tab.key)}
              className={`px-4 py-2 transition-colors duration-200 text-white rounded-full ${
                selectedNewsTab === tab.key
                  ? "bg-white/30 text-blue-500"
                  : "bg-transparent hover:bg-white/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 뉴스 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredNews.map((item) => {
          // tags 필드 처리: 배열이면 그대로 사용, 문자열이면 파싱해서 사용
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
              className="p-4 transition-colors duration-200 hover:bg-gray-800 rounded-md"
            >
              {/* 이미지 영역 (16:9 비율) */}
              <div className="relative w-full aspect-video">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover rounded-md"
                />
              </div>
              {/* 카테고리 및 감성 뱃지 */}
              <div className="mt-2 flex space-x-2">
                <span className="inline-block px-2 py-1 text-xs font-bold rounded-full bg-gray-700 text-white">
                  {getCategoryLabel(item.category)}
                </span>
                <span
                  className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${getSentimentBadgeStyles(item.sentiment)}`}
                >
                  {getSentimentLabel(item.sentiment)}
                </span>
              </div>
              {/* 관련 종목 태그 */}
              {tagsArray.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tagsArray.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs font-bold rounded-full bg-blue-700 text-white"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {/* 뉴스 제목 및 간결 요약 */}
              <h3 className="mt-1 text-base font-bold text-white">{item.title_ko || item.title}</h3>
              <p className="mt-1 text-sm text-gray-400">{item.brief_summary}</p>
              {/* 추가 정보: 발행일 */}
              <p className="mt-1 text-xs text-gray-500">
                발행일: {new Date(item.published_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default News;