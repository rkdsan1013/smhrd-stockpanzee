// /frontend/src/pages/Home.tsx
import React, { useState, useEffect } from "react";
import { fetchNews } from "../services/newsService";
import type { NewsItem } from "../services/newsService";
import NewsCard from "../components/NewsCard";
import Tooltip from "../components/Tooltip";
import FavoriteAssetsWidget from "../components/FavoriteAssetsWidget";
import CommunityPopularWidget from "../components/CommunityPopularWidget";
import HomeSkeleton from "../components/skeletons/HomeSkeleton";

const TABS = [
  { key: "all", label: "전체" },
  { key: "domestic", label: "국내" },
  { key: "international", label: "해외" },
  { key: "crypto", label: "암호화폐" },
] as const;
type TabKey = (typeof TABS)[number]["key"];
const RECENT_DAYS = 7;

const LEVELS = [1, 2, 3, 4, 5] as const;
type Level = (typeof LEVELS)[number];
const ORDERED_LEVELS: Level[] = [5, 4, 3, 2, 1];

const levelLabels: Record<Level, string> = {
  1: "매우 부정",
  2: "부정",
  3: "중립",
  4: "긍정",
  5: "매우 긍정",
};

const Home: React.FC = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabKey>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews()
      .then((data) =>
        setNewsItems(
          data.sort(
            (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
          ),
        ),
      )
      .catch((e) => setError(e.message || "뉴스 로드 실패"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <HomeSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-red-400">
        오류: {error}
      </div>
    );
  }

  const filtered =
    selectedTab === "all" ? newsItems : newsItems.filter((n) => n.category === selectedTab);

  const hero = filtered[0];
  const subNews = filtered.slice(1, 5);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
  const recent = filtered.filter((n) => new Date(n.published_at) >= cutoff);

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

  type TagStat = { total: number; pos: number; neg: number };
  const tagStats: Record<string, TagStat> = {};

  recent.forEach((item) => {
    let tags: string[] = [];
    if (Array.isArray(item.tags)) tags = item.tags;
    else if (typeof item.tags === "string") {
      try {
        const parsed = JSON.parse(item.tags);
        if (Array.isArray(parsed)) tags = parsed;
      } catch {}
    }
    const sentVal = Math.min(5, Math.max(1, Number(item.sentiment) || 3)) as Level;

    tags.forEach((t) => {
      const stat = tagStats[t] || { total: 0, pos: 0, neg: 0 };
      stat.total += 1;
      if (sentVal >= 4) stat.pos += 1;
      else if (sentVal <= 2) stat.neg += 1;
      tagStats[t] = stat;
    });
  });

  const topTags = Object.entries(tagStats)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 5);

  // 평균 감정 레이블, 이모지, 색상 계산
  const sentimentCategory =
    avgSentiment >= 4
      ? "매우 긍정"
      : avgSentiment >= 3.5
        ? "긍정"
        : avgSentiment >= 2.5
          ? "중립"
          : avgSentiment >= 2
            ? "부정"
            : "매우 부정";

  const sentimentEmoji =
    avgSentiment >= 4
      ? "😄"
      : avgSentiment >= 3.5
        ? "🙂"
        : avgSentiment >= 2.5
          ? "😐"
          : avgSentiment >= 2
            ? "😕"
            : "😞";

  const sentimentColorClass =
    avgSentiment >= 3.5 ? "text-green-300" : avgSentiment <= 2.5 ? "text-red-300" : "text-gray-300";

  return (
    <div className="bg-gray-900 min-h-screen py-8 px-4">
      <div className="max-w-screen-xl mx-auto space-y-12">
        <nav className="overflow-x-auto pb-2">
          <ul className="flex space-x-3">
            {TABS.map((t) => (
              <li key={t.key}>
                <button
                  onClick={() => setSelectedTab(t.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 flex flex-col space-y-8">
            {hero && <NewsCard newsItem={hero} variant="hero" />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {subNews.map((n) => (
                <NewsCard key={n.id} newsItem={n} variant="compact" />
              ))}
            </div>
            <CommunityPopularWidget selectedTab={selectedTab} />
          </div>

          <aside className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-white mb-4">
                뉴스 감정 분석 (최근 {RECENT_DAYS}일)
              </h3>
              <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden flex">
                {ORDERED_LEVELS.map((lvl) => {
                  const pct = distPct[lvl].toFixed(1);
                  const color =
                    lvl >= 4
                      ? lvl === 5
                        ? "bg-green-600"
                        : "bg-green-400"
                      : lvl === 3
                        ? "bg-gray-500"
                        : lvl === 2
                          ? "bg-red-400"
                          : "bg-red-600";
                  return (
                    <Tooltip
                      key={lvl}
                      label={`${levelLabels[lvl]}: ${pct}%`}
                      style={{ width: `${pct}%` }}
                    >
                      <div className={`${color} h-full`} />
                    </Tooltip>
                  );
                })}
              </div>

              {/* 이모지 + 라벨 + 소수 표시 + 미니 게이지 */}
              <div className="mt-3 text-white">
                <span className="text-sm">평균 감정</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl">{sentimentEmoji}</span>
                  <span className={`text-lg font-semibold ${sentimentColorClass}`}>
                    {sentimentCategory}
                  </span>
                  <span className="text-sm text-gray-400">({avgSentiment.toFixed(1)})</span>
                </div>
                <div className="relative w-full h-2 bg-gray-700 rounded-full mt-2 overflow-hidden">
                  <div
                    className="absolute h-full bg-blue-500"
                    style={{ width: `${((avgSentiment - 1) / 4) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>부정</span>
                  <span>긍정</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-white mb-4">
                키워드 트렌드 (최근 {RECENT_DAYS}일)
              </h3>
              {topTags.length > 0 ? (
                <ul className="space-y-4">
                  {topTags.map(([tag, stat]) => {
                    const posPct = (stat.pos / stat.total) * 100;
                    const negPct = (stat.neg / stat.total) * 100;
                    const neuPct = 100 - posPct - negPct;
                    return (
                      <li key={tag} className="space-y-1">
                        <div className="flex justify-between text-gray-300 text-sm">
                          <span>{tag}</span>
                          <span>{stat.total}건</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden flex">
                          <div className="bg-green-400 h-full" style={{ width: `${posPct}%` }} />
                          <div className="bg-gray-500 h-full" style={{ width: `${neuPct}%` }} />
                          <div className="bg-red-400 h-full" style={{ width: `${negPct}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>긍정 {posPct.toFixed(1)}%</span>
                          <span>부정 {negPct.toFixed(1)}%</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">최근 데이터 없음</p>
              )}
            </div>

            <FavoriteAssetsWidget />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Home;
