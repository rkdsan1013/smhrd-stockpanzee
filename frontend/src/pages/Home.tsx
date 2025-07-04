import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchNews } from "../services/newsService";
import type { NewsItem } from "../services/newsService";
import NewsCard from "../components/NewsCard";
import Tooltip from "../components/Tooltip";
import FavoriteAssetsWidget from "../components/FavoriteAssetsWidget";
import CommunityPopularWidget from "../components/CommunityPopularWidget";
import HomeSkeleton from "../components/skeletons/HomeSkeleton";
import { fetchAssets, getAssetDictSync, type Asset } from "../services/assetService";

/* ───────── 상수 ───────── */
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

/* ───────── market → category ───────── */
/** 주식 거래소가 아니면 모두 crypto 로 간주 (Binance·Coinbase 등도 포함) */
const marketCategory = (m: string): NewsItem["category"] => {
  const upper = m.toUpperCase();
  if (/KRX|KOSPI|KOSDAQ|KONEX/.test(upper)) return "domestic";
  if (/NASDAQ|NYSE|AMEX|OTC|TSX|LSE|HKEX|ARCA|SSE|SZSE/.test(upper)) return "international";
  return "crypto";
};

const Home: React.FC = () => {
  /* ---------- 상태 ---------- */
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabKey>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------- 자산 딕셔너리 ---------- */
  const dictRef = useRef<Record<string, Asset>>(getAssetDictSync());
  const [dictReady, setDictReady] = useState(Object.keys(dictRef.current).length > 0);

  useEffect(() => {
    if (!dictReady) {
      fetchAssets().then(() => {
        dictRef.current = getAssetDictSync();
        setDictReady(true);
      });
    }
  }, [dictReady]);

  /* ---------- 뉴스 로드 ---------- */
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

  /* ---------- 심볼별 대표 자산 ---------- */
  const primaryAssetOfSym = useMemo(() => {
    if (!dictReady) return {} as Record<string, Asset>;
    const best: Record<string, Asset> = {};
    Object.values(dictRef.current).forEach((a) => {
      const cat = marketCategory(a.market);
      const prev = best[a.symbol];
      if (
        !prev ||
        (cat === "crypto" && marketCategory(prev.market) !== "crypto") ||
        (cat === "domestic" && marketCategory(prev.market) === "international")
      ) {
        best[a.symbol] = a; // 우선순위: crypto > domestic > international
      }
    });
    return best;
  }, [dictReady]);

  /* ---------- 로딩/오류 ---------- */
  if (loading || !dictReady) return <HomeSkeleton />;
  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-red-400">
        오류: {error}
      </div>
    );

  /* ---------- 탭별 뉴스 ---------- */
  const filtered =
    selectedTab === "all" ? newsItems : newsItems.filter((n) => n.category === selectedTab);

  const hero = filtered[0];
  const subNews = filtered.slice(1, 5);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_DAYS);
  const recent = filtered.filter((n) => new Date(n.published_at) >= cutoff);

  /* ---------- 통계 ---------- */
  const dist: Record<Level, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sumWeighted = 0;

  type TagStat = { total: number; pos: number; neg: number; asset: Asset };
  const tagStats: Record<number, TagStat> = {};

  recent.forEach((item) => {
    let tags: string[] = [];
    if (Array.isArray(item.tags)) tags = item.tags;
    else if (typeof item.tags === "string")
      try {
        const p = JSON.parse(item.tags);
        if (Array.isArray(p)) tags = p;
      } catch {}

    const sentVal = Math.min(5, Math.max(1, Number(item.sentiment) || 3)) as Level;
    dist[sentVal] += 1;
    sumWeighted += sentVal;

    tags.forEach((sym) => {
      const asset = primaryAssetOfSym[sym];
      if (!asset) return;
      if (marketCategory(asset.market) !== item.category) return; // 카테고리 불일치 제외

      const key = asset.id;
      const stat = tagStats[key] || {
        total: 0,
        pos: 0,
        neg: 0,
        asset,
      };
      stat.total += 1;
      if (sentVal >= 4) stat.pos += 1;
      else if (sentVal <= 2) stat.neg += 1;
      tagStats[key] = stat;
    });
  });

  const totalRecent = recent.length || 1;
  const avgSentiment = sumWeighted / totalRecent;
  const distPct: Record<Level, number> = LEVELS.reduce(
    (acc, l) => ({ ...acc, [l]: (dist[l] / totalRecent) * 100 }),
    {} as Record<Level, number>,
  );

  const topTags = Object.values(tagStats)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

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

  /* ───────── Render ───────── */
  return (
    <div className="bg-gray-900 min-h-screen py-8 px-4">
      <div className="max-w-screen-xl mx-auto space-y-12">
        {/* 탭 */}
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
          {/* 메인 영역 */}
          <div className="lg:col-span-2 flex flex-col space-y-8">
            {hero && <NewsCard newsItem={hero} variant="hero" />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {subNews.map((n) => (
                <NewsCard key={n.id} newsItem={n} variant="compact" />
              ))}
            </div>
            <CommunityPopularWidget selectedTab={selectedTab} />
          </div>

          {/* 사이드 위젯 */}
          <aside className="space-y-6">
            {/* 감정 분석 */}
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
              <div className="mt-3 text-white">
                <span className="text-sm">평균 감정</span>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-2xl">{sentimentEmoji}</span>
                  <span className={`text-lg font-semibold ${sentimentColorClass}`}>
                    {sentimentCategory}
                  </span>
                  <span className="text-sm text-gray-400">({avgSentiment.toFixed(1)})</span>
                </div>
              </div>
            </div>

            {/* 키워드 트렌드 */}
            <div className="bg-gray-800 p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-white mb-4">
                키워드 트렌드 (최근 {RECENT_DAYS}일)
              </h3>
              {topTags.length ? (
                <ul className="space-y-4">
                  {topTags.map((stat) => {
                    const { asset, total, pos, neg } = stat;
                    const posPct = (pos / total) * 100;
                    const negPct = (neg / total) * 100;
                    const neuPct = 100 - posPct - negPct;
                    return (
                      <li key={asset.id} className="space-y-1">
                        <div className="flex justify-between text-gray-300 text-sm">
                          <Link to={`/asset/${asset.id}`} className="hover:underline">
                            {asset.name}
                          </Link>
                          <span>{total}건</span>
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
