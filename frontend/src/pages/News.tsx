// /frontend/src/pages/News.tsx
import React, { useState, useEffect, useRef } from "react";
import type { NewsItem } from "../services/newsService";
import { fetchNews } from "../services/newsService";
import NewsCard from "../components/NewsCard";

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
  // 페이지네이션 관련 상태
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6; // 한 페이지당 표시할 뉴스 개수

  // 뉴스 데이터를 불러옴
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

  // 필터 탭이 변경될 때 페이지 번호 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedNewsTab]);

  // 선택된 필터에 따라 뉴스 항목 필터링
  const filteredNews =
    selectedNewsTab === "all"
      ? newsItems
      : newsItems.filter((item) => item.category === selectedNewsTab);

  // 페이지네이션을 반영한 뉴스 항목 제한
  const visibleNews = filteredNews.slice(0, currentPage * itemsPerPage);

  // 무한 스크롤을 위한 Intersection Observer 적용
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry.isIntersecting && visibleNews.length < filteredNews.length) {
          setCurrentPage((prevPage) => prevPage + 1);
        }
      },
      { threshold: 1 },
    );
    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observer.observe(currentLoadMoreRef);
    }
    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [visibleNews, filteredNews]);

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
        {visibleNews.map((item) => (
          <NewsCard key={item.id} newsItem={item} />
        ))}
      </div>
      {/* 무한 스크롤을 위한 sentinel 요소 */}
      {visibleNews.length < filteredNews.length && <div ref={loadMoreRef} className="h-4" />}
    </div>
  );
};

export default News;
