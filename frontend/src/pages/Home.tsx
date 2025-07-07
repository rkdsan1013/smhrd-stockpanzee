// /frontend/src/pages/Home.tsx
import React, { useState, useEffect, useMemo, useContext } from "react";
import { Link } from "react-router-dom";
import Icons from "../components/Icons";
import { AuthContext } from "../providers/AuthProvider";
import { AssetContext } from "../providers/AssetProvider";
import { fetchNews } from "../services/newsService";
import { fetchFavorites } from "../services/favoriteService";
import { fetchAssets, type Asset } from "../services/assetService";
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

const PERIODS = [
  { key: "today", label: "오늘", days: 1 },
  { key: "7", label: "최근 7일", days: 7 },
  { key: "30", label: "최근 30일", days: 30 },
] as const;
type PeriodKey = (typeof PERIODS)[number]["key"];

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
const LEVEL_WEIGHTS: Record<Level, number> = {
  1: 2,
  2: 1.5,
  3: 1,
  4: 1.5,
  5: 2,
};

function marketCategory(m: string): NewsItem["category"] {
  const u = m.toUpperCase();
  if (/KRX|KOSPI|KOSDAQ|KONEX/.test(u)) return "domestic";
  if (/NASDAQ|NYSE|AMEX|OTC|TSX|LSE|HKEX|ARCA|SSE|SZSE/.test(u)) return "international";
  return "crypto";
}

const Home: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { dict: assetDict, ready: dictReady } = useContext(AssetContext);

  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabKey>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>("today");
  const [viewMode, setViewMode] = useState<"전체" | "즐겨찾기">("전체");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [favorites, setFavorites] = useState<number[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  // 인기 뉴스 불러오기
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

  // 즐겨찾기, assets (id→symbol 매핑)
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setAssets([]);
      return;
    }
    fetchFavorites()
      .then(setFavorites)
      .catch(() => setFavorites([]));
    fetchAssets()
      .then(setAssets)
      .catch(() => {});
  }, [user]);

  // favorites → symbol 리스트
  const favoriteSymbols = useMemo(() => {
    if (!favorites.length || !assets.length) return [];
    return favorites
      .map((fid) => assets.find((a) => a.id === fid)?.symbol)
      .filter((s): s is string => Boolean(s));
  }, [favorites, assets]);

  // 탭 필터
  const filteredByTab = useMemo(
    () => (selectedTab === "all" ? newsItems : newsItems.filter((n) => n.category === selectedTab)),
    [newsItems, selectedTab],
  );

  // 즐겨찾기 뷰
  const filteredForMain = useMemo(() => {
    if (viewMode === "즐겨찾기") {
      return filteredByTab.filter((n) => {
        let tags: string[] = [];
        if (Array.isArray(n.tags)) tags = n.tags;
        else
          try {
            tags = JSON.parse(n.tags as string);
          } catch {}
        return tags.some((t) => favoriteSymbols.includes(t));
      });
    }
    return filteredByTab;
  }, [filteredByTab, viewMode, favoriteSymbols]);

  // 기간 객체
  const periodObj = useMemo(() => PERIODS.find((p) => p.key === selectedPeriod)!, [selectedPeriod]);
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - periodObj.days);
    return d;
  }, [periodObj]);

  // 최근 뉴스 & 인기 정렬
  const recent = useMemo(
    () => filteredByTab.filter((n) => new Date(n.published_at) >= cutoff),
    [filteredByTab, cutoff],
  );
  const displayNews = useMemo(() => {
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    return filteredForMain
      .filter((n) => new Date(n.published_at) >= dayAgo)
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
  }, [filteredForMain]);

  // 뉴스 통계: 감정 평균, 분포
  const dist: Record<Level, number> = useMemo(
    () => LEVELS.reduce((acc, l) => ({ ...acc, [l]: 0 }), {} as Record<Level, number>),
    [],
  );
  let sumWeighted = 0,
    sumWeights = 0;
  const weightedEntries: Array<{
    level: Level;
    weight: number;
  }> = [];
  recent.forEach((n) => {
    const lvl = Math.min(5, Math.max(1, Number(n.sentiment) || 3)) as Level;
    dist[lvl] += 1;
    const daysAgo = (Date.now() - new Date(n.published_at).getTime()) / (1000 * 60 * 60 * 24);
    const timeWeight = Math.max(0.1, (periodObj.days - daysAgo) / periodObj.days);
    const weight = LEVEL_WEIGHTS[lvl] * timeWeight;
    sumWeighted += lvl * weight;
    sumWeights += weight;
    weightedEntries.push({ level: lvl, weight });
  });
  const avgSentiment = sumWeights ? sumWeighted / sumWeights : 3;
  const stdDev = Math.sqrt(
    weightedEntries.reduce((s, { level, weight }) => s + weight * (level - avgSentiment) ** 2, 0) /
      (sumWeights || 1),
  );
  const distPct: Record<Level, number> = LEVELS.reduce(
    (acc, l) => {
      acc[l] = (dist[l] / (recent.length || 1)) * 100;
      return acc;
    },
    {} as Record<Level, number>,
  );

  // pickAsset: 심볼 + 뉴스 카테고리로 필터
  const pickAsset = (symRaw: string, targetCategory: NewsItem["category"]): Asset | null => {
    const up = symRaw.toUpperCase();
    const cands = assetDict[up] || [];
    if (!cands.length) return null;
    const matched = cands.filter((a) => marketCategory(a.market) === targetCategory);
    return matched.length ? matched[0] : cands[0];
  };

  // 키워드 통계
  type TagStat = {
    total: number;
    pos: number;
    neg: number;
    asset: Asset;
  };
  const tagStats: Record<number, TagStat> = {};
  recent.forEach((item) => {
    let tags: string[] = [];
    if (Array.isArray(item.tags)) tags = item.tags;
    else
      try {
        tags = JSON.parse(item.tags);
      } catch {}
    const lvl = Math.min(5, Math.max(1, Number(item.sentiment) || 3)) as Level;
    tags.forEach((sym) => {
      const a = pickAsset(sym, item.category);
      if (!a) return;
      const key = a.id;
      const stat = tagStats[key] || ({ total: 0, pos: 0, neg: 0, asset: a } as TagStat);
      stat.total += 1;
      if (lvl >= 4) stat.pos += 1;
      else if (lvl <= 2) stat.neg += 1;
      tagStats[key] = stat;
    });
  });
  const topTags = Object.values(tagStats)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // UI 핸들러 & 라벨
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
  const sentimentBarColor =
    avgSentiment >= 4
      ? "bg-green-500"
      : avgSentiment >= 3.5
        ? "bg-green-400"
        : avgSentiment >= 2.5
          ? "bg-gray-500"
          : avgSentiment >= 2
            ? "bg-red-400"
            : "bg-red-600";
  const avgLabel = `${avgSentiment.toFixed(1)}/5`;
  const selectedTabLabel = TABS.find((t) => t.key === selectedTab)?.label || "";

  const handleTabClick = (key: TabKey) => {
    setSelectedTab(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleView = () => {
    if (!user) {
      alert("즐겨찾기 페이지는 로그인 후 확인할 수 있습니다.");
      return;
    }
    setViewMode((m) => (m === "전체" ? "즐겨찾기" : "전체"));
  };

  if (loading || !dictReady) return <HomeSkeleton />;
  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-red-400">
        오류: {error}
      </div>
    );

  const hero = displayNews[0];
  const subNews = displayNews.slice(1, 5);

  return (
    <div className="bg-gray-900 min-h-screen py-8 px-4">
      <div className="max-w-screen-xl mx-auto space-y-8">
        {/* 네비게이션 */}
        <nav className="overflow-x-auto flex justify-start mb-8">
          <ul className="flex space-x-6 border-b border-gray-700">
            <li>
              <button
                onClick={toggleView}
                className={`px-4 py-2 -mb-px transition-colors ${
                  viewMode === "즐겨찾기"
                    ? "text-yellow-400 border-b-2 border-yellow-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Icons name="banana" className="w-5 h-5" />
              </button>
            </li>
            {TABS.map((t) => (
              <li key={t.key}>
                <button
                  onClick={() => handleTabClick(t.key)}
                  className={`px-4 py-2 -mb-px text-sm font-medium transition-colors ${
                    selectedTab === t.key
                      ? "text-white border-b-2 border-blue-500"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* 인기 뉴스 */}
          <div className="lg:col-span-2 flex flex-col space-y-8">
            <p className="text-lg text-white font-semibold mb-4">오늘 인기 뉴스</p>
            {hero && <NewsCard newsItem={hero} variant="hero" />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {subNews.map((n) => (
                <NewsCard key={n.id} newsItem={n} variant="compact" />
              ))}
            </div>

            <CommunityPopularWidget selectedTab={selectedTab} />
          </div>

          {/* 분석 사이드바 */}
          <aside className="space-y-6">
            {/* 기간 선택 */}
            <nav className="overflow-x-auto pb-2">
              <ul className="flex space-x-3">
                {PERIODS.map((p) => (
                  <li key={p.key}>
                    <button
                      onClick={() => setSelectedPeriod(p.key)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedPeriod === p.key
                          ? "bg-green-600 text-white"
                          : "text-gray-300 hover:bg-green-500 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* 감정 분석 */}
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-white mb-4">
                {selectedTabLabel} 뉴스 감정 분석 ({periodObj.label})
              </h3>

              {/* 분포 바 */}
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

              {/* 평균 감정 */}
              <div className="mt-4 text-white">
                <span className="text-sm">평균 감정</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl">{sentimentEmoji}</span>
                  <span className={`text-lg font-semibold ${sentimentColorClass}`}>
                    {sentimentCategory}
                  </span>
                  <span className="text-sm text-gray-400">({avgLabel})</span>
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`${sentimentBarColor} h-full`}
                    style={{
                      width: `${(avgSentiment / 5) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">표준편차: {stdDev.toFixed(2)}</p>
              </div>
            </div>

            {/* 키워드 트렌드 */}
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-white mb-4">
                {selectedTabLabel} 키워드 트렌드 ({periodObj.label})
              </h3>
              {topTags.length ? (
                <ul className="space-y-4">
                  {topTags.map(({ asset, total, pos, neg }, idx) => {
                    const posPct = (pos / total) * 100;
                    const negPct = (neg / total) * 100;
                    const neuPct = 100 - posPct - negPct;
                    return (
                      <li key={idx} className="space-y-1">
                        <div className="flex justify-between text-gray-300 text-sm">
                          <Link to={`/asset/${asset.id}`} className="hover:underline">
                            {asset.name}
                          </Link>
                          <span>{total}건</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden flex">
                          <div
                            className="bg-green-400 h-full"
                            style={{
                              width: `${posPct}%`,
                            }}
                          />
                          <div
                            className="bg-gray-500 h-full"
                            style={{
                              width: `${neuPct}%`,
                            }}
                          />
                          <div
                            className="bg-red-400 h-full"
                            style={{
                              width: `${negPct}%`,
                            }}
                          />
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
