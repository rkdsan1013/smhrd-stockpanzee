// /frontend/src/pages/NewsDetail.tsx
import React, { useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchNewsDetail,
  fetchLatestNewsByAsset,
  type NewsDetail as NewsDetailType,
  type NewsItem,
} from "../services/newsService";
import { AssetContext } from "../providers/AssetProvider";
import { TradingViewMiniChart } from "../components/Chart/TradingViewMiniChart";
import { getTradingViewSymbol } from "../services/tradingViewService";
import NewsCard from "../components/NewsCard";
import NewsDetailSkeleton from "../components/skeletons/NewsDetailSkeleton";

const MAX_LATEST = 5;
const DEFAULT_THUMB = "/placeholder.webp";
const sentimentLabels = ["매우 부정", "부정", "중립", "긍정", "매우 긍정"] as const;
const stepColors = ["bg-red-600", "bg-orange-500", "bg-yellow-400", "bg-blue-400", "bg-green-500"];

// 시장 구분 유틸
const marketCategory = (m: string): NewsDetailType["news_category"] => {
  const mm = m.toUpperCase();
  if (mm === "KOSPI" || mm === "KOSDAQ") return "domestic";
  if (mm === "NASDAQ" || mm === "NYSE") return "international";
  if (mm.includes("BINANCE")) return "crypto";
  return "international";
};

const ProgressBar: React.FC<{ score?: number }> = ({ score }) => {
  if (score == null || isNaN(score))
    return <span className="text-gray-400 text-sm">데이터 없음</span>;
  const valid = Math.min(5, Math.max(1, Math.round(score)));
  const fill = stepColors[valid - 1];
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex h-2 w-32 space-x-[2px]">
        {Array.from({ length: 5 }).map((_, i) => {
          const bg = i < valid ? fill : "bg-gray-700";
          const left = i === 0 ? "rounded-l-full" : "";
          const right = i === 4 ? "rounded-r-full" : "";
          return <div key={i} className={`flex-1 ${bg} ${left} ${right}`} />;
        })}
      </div>
      <span className="text-sm font-bold text-white">{sentimentLabels[valid - 1]}</span>
    </div>
  );
};

const parseList = (val?: string | string[]): string[] => {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  try {
    const p = JSON.parse(val);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
};

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const newsId = Number(id);

  const { dict: assetDict, ready: assetsReady } = useContext(AssetContext);

  const [news, setNews] = useState<NewsDetailType | null>(null);
  const [latest, setLatest] = useState<NewsItem[]>([]);
  const [primaryAsset, setPrimaryAsset] = useState<{
    id: number;
    symbol: string;
    name: string;
    market: string;
  } | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  // 태그 → 우선 첫번째 자산을 pick
  const pickAsset = (symRaw: string) => {
    const up = symRaw.toUpperCase();
    const cands = assetDict[up] || [];
    if (cands.length === 0) return null;
    // 뉴스 카테고리 순서
    const order =
      news?.news_category === "crypto"
        ? ["crypto", "domestic", "international"]
        : news?.news_category === "domestic"
          ? ["domestic", "international", "crypto"]
          : ["international", "domestic", "crypto"];
    for (const cat of order) {
      const a = cands.find((x) => marketCategory(x.market) === cat);
      if (a) return a;
    }
    return cands[0];
  };

  useEffect(() => {
    setStatus("loading");
    fetchNewsDetail(newsId)
      .then((nd) => {
        setNews(nd);
        const tags = parseList(nd.tags);
        const firstSym = tags.length ? tags[0] : nd.assets_symbol || "";
        const asset = pickAsset(firstSym);
        setPrimaryAsset(asset);
        if (asset) {
          return fetchLatestNewsByAsset(asset.symbol, nd.id);
        }
        return Promise.resolve([]);
      })
      .then((rel) => {
        setLatest(rel.slice(0, MAX_LATEST));
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, [newsId, assetDict]);

  if (!assetsReady || status === "loading") {
    return <NewsDetailSkeleton latestCount={MAX_LATEST} />;
  }
  if (status === "error" || !news) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400">
        뉴스를 불러올 수 없습니다.
      </div>
    );
  }

  // 차트 심볼: primaryAsset 기반
  const tvSymbol = primaryAsset
    ? primaryAsset.market.toUpperCase().includes("BINANCE")
      ? `BINANCE:${primaryAsset.symbol.toUpperCase()}USDT`
      : getTradingViewSymbol(primaryAsset.symbol, primaryAsset.market)
    : "";

  const positives = parseList(news.news_positive);
  const negatives = parseList(news.news_negative);
  const tags = parseList(news.tags);

  const tagClasses =
    "inline-block px-3 py-1 bg-blue-600 text-sm font-semibold rounded-full transition hover:bg-blue-500";

  const renderTag = (symRaw: string) => {
    const asset = pickAsset(symRaw);
    const label = asset ? asset.name : symRaw;
    return asset ? (
      <Link key={symRaw} to={`/asset/${asset.id}`} className={tagClasses}>
        {label}
      </Link>
    ) : (
      <span key={symRaw} className={tagClasses}>
        {label}
      </span>
    );
  };

  // 사이드바 헤더 제목
  const headerTitle = primaryAsset ? primaryAsset.name : news.assets_symbol;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 space-y-8">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 flex flex-col">
                <h1 className="text-3xl font-bold">{news.title_ko}</h1>
                <div className="flex flex-wrap gap-2 mt-3">{tags.map(renderTag)}</div>
                <div className="mt-auto pt-4 text-gray-400 text-sm flex flex-wrap gap-2">
                  <span>{news.publisher}</span>
                  <span>•</span>
                  <span>{new Date(news.published_at).toLocaleString()}</span>
                  <span>•</span>
                  <a
                    href={news.news_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline"
                  >
                    원문 보기
                  </a>
                </div>
              </div>
              {/* Thumbnail */}
              <div className="w-full md:w-1/3 flex-shrink-0">
                <img
                  src={news.thumbnail || DEFAULT_THUMB}
                  alt="썸네일"
                  className="w-full h-48 object-cover rounded-2xl"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    currentTarget.src = DEFAULT_THUMB;
                  }}
                />
              </div>
            </div>
          </div>

          {/* AI 요약 & 평가 */}
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">AI 요약 & 평가</h2>
              <ProgressBar score={news.news_sentiment} />
            </div>
            <p className="text-gray-200 mt-4">{news.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-semibold text-green-400 mb-2">긍정 평가</h3>
                {positives.length ? (
                  <ul className="list-disc list-inside space-y-1 text-green-300">
                    {positives.map((it, i) => (
                      <li key={i}>{it}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">해당 없음</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-red-400 mb-2">부정 평가</h3>
                {negatives.length ? (
                  <ul className="list-disc list-inside space-y-1 text-red-300">
                    {negatives.map((it, i) => (
                      <li key={i}>{it}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">해당 없음</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col space-y-6">
          <div className="rounded-2xl overflow-hidden shadow-lg h-56 w-full">
            <TradingViewMiniChart symbol={tvSymbol} />
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">{headerTitle} 최신 뉴스</h4>
            <div className="flex flex-col gap-4">
              {latest.length ? (
                latest.map((n) => <NewsCard key={n.id} newsItem={n} variant="compact" />)
              ) : (
                <p className="text-gray-500">관련 뉴스 없음</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default NewsDetail;
