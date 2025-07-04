import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  fetchNewsDetail,
  fetchLatestNewsByAsset,
  fetchNews,
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

/* ───────── 공통 컴포넌트 ───────── */
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

/* ───────── 유틸 ───────── */
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

/* 거래소 분류 → category */
const marketCategory = (m: string): NewsDetail["news_category"] =>
  /KRX|KOSPI|KOSDAQ|KONEX/i.test(m) ? "domestic" : /CRYPTO/i.test(m) ? "crypto" : "international";

/* ───────── 본문 ───────── */
const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const newsId = Number(id);

  const [news, setNews] = useState<NewsDetail | null>(null);
  const [latest, setLatest] = useState<NewsItem[]>([]);
  const [allNews, setAllNews] = useState<Pick<NewsItem, "id" | "title_ko" | "published_at">[]>([]);
  /* 심볼 → Asset[] */
  const [assetsBySymbol, setAssetsBySymbol] = useState<Record<string, Asset[]>>({});
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  /* 자산 로드 & 맵 작성 */
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

  /* 전체 뉴스 인덱스 로드 */
  useEffect(() => {
    fetchNews()
      .then((list) =>
        setAllNews(
          list.map((n) => ({
            id: n.id,
            title_ko: n.title_ko,
            published_at: n.published_at,
          })),
        ),
      )
      .catch(() => setAllNews([]));
  }, []);

  /* 상세 + 연관 뉴스 */
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

  if (status === "loading") return <NewsDetailSkeleton latestCount={MAX_LATEST} />;
  if (status === "error" || !news) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400">
        뉴스를 불러올 수 없습니다.
      </div>
    );
  }

  /* ---------- 이전/다음 ---------- */
  const idx = allNews.findIndex((n) => n.id === newsId);
  const prevNews = idx > 0 ? allNews[idx - 1] : null;
  const nextNews = idx < allNews.length - 1 ? allNews[idx + 1] : null;

  /* ---------- 차트 심볼 ---------- */
  const tvSymbol = news.assets_symbol
    ? news.news_category === "crypto"
      ? `BINANCE:${news.assets_symbol.toUpperCase()}USDT`
      : getTradingViewSymbol(news.assets_symbol, news.assets_market!)
    : "";

  /* ---------- 리스트 파싱 ---------- */
  const positives = parseList(news.news_positive);
  const negatives = parseList(news.news_negative);
  const tags = parseList(news.tags);

  /* ---------- 태그 → 회사명 렌더 ---------- */
  const renderTag = (symRaw: string) => {
    const sym = symRaw.toUpperCase();
    const cands = assetsBySymbol[sym];
    if (!cands?.length) {
      return (
        <span key={symRaw} className="bg-blue-600 px-3 py-1 rounded-full text-sm">
          {symRaw}
        </span>
      );
    }

    /* 카테고리 일치 자산 우선 */
    const primary =
      cands.find((a) => marketCategory(a.market) === news.news_category) ||
      /* crypto > domestic > international */
      cands.find((a) => marketCategory(a.market) === "crypto") ||
      cands.find((a) => marketCategory(a.market) === "domestic") ||
      cands[0];

    return (
      <Link
        key={symRaw}
        to={`/asset/${primary.id}`}
        className="bg-blue-600 px-3 py-1 rounded-full text-sm hover:underline"
      >
        {primary.name}
      </Link>
    );
  };

  /* ───────── JSX ───────── */
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 space-y-8">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ---------- Main Column ---------- */}
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

              {/* 썸네일 */}
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
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold">AI 요약 & 평가</h2>
              <div className="flex space-x-8">
                <div>
                  <div className="text-gray-300 text-xs mb-1">AI 감정평가</div>
                  <ProgressBar score={news.news_sentiment} />
                </div>
                <div>
                  <div className="text-gray-300 text-xs mb-1">커뮤니티 반응</div>
                  <ProgressBar score={Number(news.community_sentiment)} />
                </div>
              </div>
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

        {/* ---------- Sidebar ---------- */}
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

      {/* ---------- Prev / Next ---------- */}
      <div className="max-w-screen-xl mx-auto py-6 flex justify-between">
        <button
          disabled={!prevNews}
          onClick={() => prevNews && navigate(`/news/${prevNews.id}`)}
          className={`px-4 py-2 rounded-lg bg-gray-800 hover:bg-blue-700 text-white font-semibold transition ${
            !prevNews && "opacity-40 cursor-not-allowed"
          }`}
        >
          ← 이전 뉴스
        </button>
        <button
          disabled={!nextNews}
          onClick={() => nextNews && navigate(`/news/${nextNews.id}`)}
          className={`px-4 py-2 rounded-lg bg-gray-800 hover:bg-blue-700 text-white font-semibold transition ${
            !nextNews && "opacity-40 cursor-not-allowed"
          }`}
        >
          다음 뉴스 →
        </button>
      </div>
    </div>
  );
};

export default NewsDetailPage;
