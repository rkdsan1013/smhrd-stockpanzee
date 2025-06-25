// frontend/src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import { fetchNews } from "../services/newsService";
import type { NewsItem } from "../services/newsService";
import NewsCard from "../components/NewsCard";

const TABS = [
  { key: "all", label: "전체" },
  { key: "domestic", label: "국내" },
  { key: "international", label: "해외" },
  { key: "crypto", label: "암호화폐" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const Home: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabKey>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews()
      .then((data) => {
        setNewsItems(
          data.sort(
            (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
          ),
        );
      })
      .catch((e) => setError(e.message || "뉴스 로드 실패"))
      .finally(() => setLoading(false));
  }, []);

  // 탭 필터링
  const filtered =
    selectedTab === "all" ? newsItems : newsItems.filter((n) => n.category === selectedTab);

  // 대표·서브 뉴스
  const hero = filtered[0];
  const subNews = filtered.slice(1, 5);

  // 키워드 트렌드 집계
  const tagCounts: Record<string, number> = {};
  filtered.forEach((item) => {
    let tags: string[] = [];
    if (Array.isArray(item.tags)) tags = item.tags;
    else if (typeof item.tags === "string") {
      try {
        const p = JSON.parse(item.tags);
        if (Array.isArray(p)) tags = p;
      } catch {}
    }
    tags.forEach((t) => (tagCounts[t] = (tagCounts[t] || 0) + 1));
  });
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // 투자 감성 통계
  const total = filtered.length || 1;
  let posCount = 0,
    negCount = 0;
  filtered.forEach((n) => {
    const v = Number(n.sentiment) || 3;
    if (v >= 4) posCount++;
    if (v <= 2) negCount++;
  });
  const posPercent = (posCount / total) * 100;
  const negPercent = (negCount / total) * 100;

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        뉴스 로딩 중…
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-red-400">
        오류: {error}
      </div>
    );

  return (
    <div className="bg-gray-900 min-h-screen py-8 px-4">
      <div className="max-w-screen-xl mx-auto space-y-12">
        {/* 1. 탭 */}
        <nav className="overflow-x-auto pb-2">
          <ul className="flex space-x-3">
            {TABS.map((t) => (
              <li key={t.key}>
                <button
                  onClick={() => setSelectedTab(t.key)}
                  className={`px-4 py-2 whitespace-nowrap rounded-full text-sm font-medium transition-colors ${
                    selectedTab === t.key
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-blue-500 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 2. 메인 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 뉴스 콘텐츠 (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* 히어로 카드 */}
            {hero && <NewsCard newsItem={hero} variant="hero" />}

            {/* 서브 뉴스 카드 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {subNews.map((n) => (
                <NewsCard key={n.id} newsItem={n} variant="compact" />
              ))}
            </div>
          </div>

          {/* 3. 사이드바 (1/3) */}
          <aside className="space-y-6">
            {/* 투자 감성 통계 */}
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-white mb-4">투자 감성</h3>
              <div className="space-y-4">
                {/* 긍정 바 */}
                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>긍정</span>
                    <span>{posPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-2" style={{ width: `${posPercent}%` }} />
                  </div>
                </div>
                {/* 부정 바 */}
                <div>
                  <div className="flex justify-between text-sm text-gray-300 mb-1">
                    <span>부정</span>
                    <span>{negPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-2" style={{ width: `${negPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 키워드 트렌드 */}
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-white mb-4">키워드 트렌드</h3>
              {topTags.length > 0 ? (
                <ul className="text-gray-300 space-y-2 text-sm">
                  {topTags.map(([tag, cnt]) => (
                    <li key={tag} className="flex justify-between px-2 py-1 bg-gray-700 rounded">
                      <span>#{tag}</span>
                      <span className="font-medium">{cnt}회</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">태그 데이터 없음</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Home;
