// /frontend/src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import { fetchNews } from "../services/newsService";
import type { NewsItem } from "../services/newsService";
import NewsCard from "../components/NewsCard";
import Tooltip from "../components/Tooltip";

const TABS = [
  { key: "all", label: "전체" },
  { key: "domestic", label: "국내" },
  { key: "international", label: "해외" },
  { key: "crypto", label: "암호화폐" },
] as const;
type TabKey = (typeof TABS)[number]["key"];
const RECENT_DAYS = 7;

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

  // 1) 카테고리 필터
  const filtered =
    selectedTab === "all" ? newsItems : newsItems.filter((n) => n.category === selectedTab);

  // 2) 히어로 + 서브 뉴스
  const hero = filtered[0];
  const subNews = filtered.slice(1, 5);

  // 3) 최근 7일 필터
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
  const recent = filtered.filter((n) => new Date(n.published_at) >= cutoff);

  // 4) 감정 분포 계산
  type Level = 1 | 2 | 3 | 4 | 5;
  const LEVELS: Level[] = [1, 2, 3, 4, 5];

  const dist = LEVELS.reduce<Record<Level, number>>(
    (acc, lvl) => {
      acc[lvl] = 0;
      return acc;
    },
    {} as Record<Level, number>,
  );

  let sumWeighted = 0;
  recent.forEach((n) => {
    const v = Math.min(5, Math.max(1, Number(n.sentiment) || 3)) as Level;
    dist[v] += 1;
    sumWeighted += v;
  });

  const totalRecent = recent.length || 1;
  const avgSentiment = sumWeighted / totalRecent;

  const distPct = LEVELS.reduce<Record<Level, number>>(
    (acc, lvl) => {
      acc[lvl] = (dist[lvl] / totalRecent) * 100;
      return acc;
    },
    {} as Record<Level, number>,
  );

  const levelLabels: Record<Level, string> = {
    1: "매우 부정",
    2: "부정",
    3: "중립",
    4: "긍정",
    5: "매우 긍정",
  };

  // 5) 키워드 트렌드
  const tagCounts: Record<string, number> = {};
  recent.forEach((item) => {
    let tags: string[] = [];
    if (Array.isArray(item.tags)) tags = item.tags;
    else if (typeof item.tags === "string") {
      try {
        const parsed = JSON.parse(item.tags);
        if (Array.isArray(parsed)) tags = parsed;
      } catch {}
    }
    tags.forEach((t) => (tagCounts[t] = (tagCounts[t] || 0) + 1));
  });
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        뉴스 로딩 중…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-red-400">
        오류: {error}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen py-8 px-4">
      <div className="max-w-screen-xl mx-auto space-y-12">
        {/* 카테고리 탭 */}
        <nav className="overflow-x-auto pb-2">
          <ul className="flex space-x-3">
            {TABS.map((t) => (
              <li key={t.key}>
                <button
                  onClick={() => setSelectedTab(t.key)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                    transition-colors
                    ${
                      selectedTab === t.key
                        ? "bg-blue-600 text-white"
                        : "text-gray-300 hover:bg-blue-500 hover:text-white"
                    }
                  `}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 메인 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 뉴스 영역 (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {hero && <NewsCard newsItem={hero} variant="hero" />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {subNews.map((n) => (
                <NewsCard key={n.id} newsItem={n} variant="compact" />
              ))}
            </div>
          </div>

          {/* 사이드바 (1/3) */}
          <aside className="space-y-6">
            {/* 뉴스 감정 분석 */}
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-white mb-4">
                뉴스 감정 분석 (최근 {RECENT_DAYS}일)
              </h3>
              {/* rounded + overflow-hidden 유지 */}
              <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden flex">
                {LEVELS.map((lvl) => {
                  const pct = distPct[lvl].toFixed(1);
                  const color =
                    lvl <= 2
                      ? lvl === 1
                        ? "bg-red-600"
                        : "bg-red-400"
                      : lvl === 3
                        ? "bg-gray-500"
                        : lvl === 4
                          ? "bg-green-400"
                          : "bg-green-600";

                  // 툴팁을 위한 폭만 style 로 전달
                  return (
                    <Tooltip
                      key={lvl}
                      label={`${levelLabels[lvl]}: ${pct}%`}
                      style={{ width: `${pct}%` }}
                    >
                      <div className={`${color} w-full h-full`} />
                    </Tooltip>
                  );
                })}
              </div>

              {/* 평균 감정 */}
              <div className="mt-3 text-white flex items-center justify-between">
                <span className="text-sm">평균 감정</span>
                <span
                  className={`
                    text-lg font-semibold
                    ${
                      avgSentiment >= 3.5
                        ? "text-green-300"
                        : avgSentiment <= 2.5
                          ? "text-red-300"
                          : "text-gray-300"
                    }
                  `}
                >
                  {avgSentiment.toFixed(2)}
                </span>
              </div>
            </div>

            {/* 키워드 트렌드 */}
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-white mb-4">
                키워드 트렌드 (최근 {RECENT_DAYS}일)
              </h3>
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
                <p className="text-gray-500 text-sm">최근 데이터 없음</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Home;
