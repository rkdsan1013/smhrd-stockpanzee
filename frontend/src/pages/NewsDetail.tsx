// /frontend/src/pages/NewsDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchNewsDetail,
  fetchLatestNewsByAsset,
  type NewsDetail,
  type NewsItem,
} from "../services/newsService";
import { fetchAssets, type Asset } from "../services/assetService";
import { TradingViewMiniChart } from "../components/Chart/TradingViewMiniChart";
import { getTradingViewSymbol } from "../services/tradingViewService";
import NewsCard from "../components/NewsCard";
import NewsDetailSkeleton from "../components/skeletons/NewsDetailSkeleton";

/* ───────── 상수 ───────── */
const MAX_LATEST = 5;
const DEFAULT_THUMB = "/placeholder.webp";
const sentimentLabels = ["매우 부정", "부정", "중립", "긍정", "매우 긍정"] as const;
const stepColors = ["bg-red-600", "bg-orange-500", "bg-yellow-400", "bg-blue-400", "bg-green-500"];

/* ProgressBar */
const ProgressBar: React.FC<{ score?: number }> = ({ score }) => {
  if (score == null || isNaN(score)) {
    return <span className="text-gray-400 text-sm">데이터 없음</span>;
  }
  const valid = Math.min(5, Math.max(1, Math.round(score)));
  const fillColor = stepColors[valid - 1];
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex h-2 w-32 space-x-[2px]">
        {Array.from({ length: 5 }).map((_, i) => {
          const bg = i < valid ? fillColor : "bg-gray-700";
          const left = i === 0 ? "rounded-l-full" : "";
          const right = i === 4 ? "rounded-r-full" : "";
          return <div key={i} className={`flex-1 ${bg} ${left} ${right}`} />;
        })}
      </div>
      <span className="text-sm font-bold text-white">{sentimentLabels[valid - 1]}</span>
    </div>
  );
};

/* 리스트 파싱 */
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

/* 거래소 → 카테고리 */
const marketCategory = (m: string): NewsDetail["news_category"] =>
  /KRX|KOSPI|KOSDAQ|KONEX/i.test(m) ? "domestic" : /CRYPTO/i.test(m) ? "crypto" : "international";

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const newsId = Number(id);

  const [news, setNews] = useState<NewsDetail | null>(null);
  const [latest, setLatest] = useState<NewsItem[]>([]);
  const [assetsBySymbol, setAssetsBySymbol] = useState<Record<string, Asset[]>>({});
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  /* 자산 맵 로드 */
  useEffect(() => {
    fetchAssets()
      .then((list) => {
        const map: Record<string, Asset[]> = {};
        list.forEach((a) => {
          const sym = a.symbol.toUpperCase();
          (map[sym] ||= []).push(a);
        });
        setAssetsBySymbol(map);
      })
      .catch(() => {});
  }, []);

  /* 상세 & 연관 뉴스 */
  useEffect(() => {
    setStatus("loading");
    fetchNewsDetail(newsId)
      .then((nd) => {
        setNews(nd);
        if (nd.assets_symbol) {
          return fetchLatestNewsByAsset(nd.assets_symbol, nd.id);
        }
        return [] as NewsItem[];
      })
      .then((rel) => {
        setLatest(rel.slice(0, MAX_LATEST));
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, [newsId]);

  if (status === "loading") {
    return <NewsDetailSkeleton latestCount={MAX_LATEST} />;
  }
  if (status === "error" || !news) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400">
        뉴스를 불러올 수 없습니다.
      </div>
    );
  }

  /* 차트 심볼 */
  const tvSymbol = news.assets_symbol
    ? news.news_category === "crypto"
      ? `BINANCE:${news.assets_symbol.toUpperCase()}USDT`
      : getTradingViewSymbol(news.assets_symbol, news.assets_market!)
    : "";

  /* 긍정/부정/태그 */
  const positives = parseList(news.news_positive);
  const negatives = parseList(news.news_negative);
  const tags = parseList(news.tags);

  /* 태그 렌더러 (뉴스 카드와 동일한 hover 효과) */
  const baseTagClasses =
    "inline-block px-3 py-1 bg-blue-600 text-sm font-semibold rounded-full transition hover:bg-blue-500";
  const renderTag = (symRaw: string) => {
    const sym = symRaw.toUpperCase();
    const cands = assetsBySymbol[sym];
    if (!cands?.length) {
      return (
        <span key={symRaw} className={baseTagClasses}>
          {symRaw}
        </span>
      );
    }
    const primary = cands.find((a) => marketCategory(a.market) === news.news_category) || cands[0];
    return (
      <Link key={symRaw} to={`/asset/${primary.id}`} className={baseTagClasses}>
        {primary.name}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 space-y-8">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main */}
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

          {/* AI 요약 & 평가 (커뮤니티 반응 제거) */}
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
            <h4 className="text-white font-bold mb-4">
              {news.assets_name ?? news.assets_symbol ?? "관련"} 최신 뉴스
            </h4>
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
