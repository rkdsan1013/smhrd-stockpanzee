// /frontend/src/pages/NewsDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchNewsDetail, fetchLatestNewsByAsset, fetchNews } from "../services/newsService";
import { fetchAssets } from "../services/assetService";
import type { NewsDetail, NewsItem } from "../services/newsService";
import { TradingViewMiniChart } from "../components/Chart/TradingViewMiniChart";
import { getTradingViewSymbol } from "../services/tradingViewService";
import NewsCard from "../components/NewsCard";

const MAX_LATEST = 5;
const DEFAULT_THUMB = "/panzee.webp";
const sentimentLabels = ["매우 부정", "부정", "중립", "긍정", "매우 긍정"];
const stepColors = ["bg-red-600", "bg-orange-500", "bg-yellow-400", "bg-blue-400", "bg-green-500"];

const ProgressBar: React.FC<{ score?: number }> = ({ score }) => {
  if (score == null || isNaN(score)) {
    return <span className="text-gray-400 text-sm">데이터 없음</span>;
  }
  const valid = Math.max(1, Math.min(5, Math.round(score)));
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

const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [news, setNews] = useState<NewsDetail | null>(null);
  const [latest, setLatest] = useState<NewsItem[]>([]);
  const [allNews, setAllNews] = useState<
    Pick<NewsItem, "id" | "title_ko" | "title" | "published_at">[]
  >([]);
  const [assetsMap, setAssetsMap] = useState<Record<string, Record<string, number>>>({});
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");

  useEffect(() => {
    fetchAssets()
      .then((list) => {
        const map: any = {};
        list.forEach((a) => {
          const sym = a.symbol.toUpperCase();
          const mkt = a.market.toUpperCase();
          if (!map[sym]) map[sym] = {};
          map[sym][mkt] = a.id;
        });
        setAssetsMap(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchNews()
      .then((list) =>
        setAllNews(
          list.map((n) => ({
            id: n.id,
            title_ko: n.title_ko,
            title: n.title,
            published_at: n.published_at,
          })),
        ),
      )
      .catch(() => setAllNews([]));
  }, []);

  useEffect(() => {
    if (!id) return setStatus("error");
    setStatus("loading");
    fetchNewsDetail(+id)
      .then((nd) => {
        setNews(nd);
        return nd.assets_symbol
          ? fetchLatestNewsByAsset(nd.assets_symbol, nd.id)
          : Promise.resolve([]);
      })
      .then((rel) => {
        setLatest(rel.slice(0, MAX_LATEST));
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, [id]);

  const idx = allNews.findIndex((n) => n.id === Number(id));
  const prevNews = idx > 0 ? allNews[idx - 1] : null;
  const nextNews = idx >= 0 && idx < allNews.length - 1 ? allNews[idx + 1] : null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prevNews) {
        navigate(`/news/${prevNews.id}`);
      }
      if (e.key === "ArrowRight" && nextNews) {
        navigate(`/news/${nextNews.id}`);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prevNews, nextNews, navigate]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        로딩 중…
      </div>
    );
  }

  if (status === "error" || !news) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-red-400">
        뉴스를 불러올 수 없습니다.
      </div>
    );
  }

  const positives = parseList(news.news_positive);
  const negatives = parseList(news.news_negative);
  const tags = parseList(news.tags);
  const tvSymbol = news.assets_symbol
    ? news.news_category === "crypto"
      ? `BINANCE:${news.assets_symbol.toUpperCase()}USDT`
      : getTradingViewSymbol(news.assets_symbol, news.assets_market!)
    : "";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 space-y-8">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: header, sentiment, summary, positive/negative */}
        <div className="md:col-span-2 flex flex-col space-y-6">
          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <h1 className="text-3xl font-bold break-words">{news.title_ko}</h1>
              <div className="text-gray-400 text-sm flex flex-wrap items-center gap-2">
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
            <img
              src={news.thumbnail || DEFAULT_THUMB}
              alt="썸네일"
              className="w-full max-w-xs h-40 object-cover rounded-2xl"
              onError={({ currentTarget }) => {
                currentTarget.onerror = null;
                currentTarget.src = DEFAULT_THUMB;
              }}
            />
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="text-gray-300 text-xs mb-1">AI 감정평가</div>
              <ProgressBar score={news.news_sentiment} />
            </div>
            <div>
              <div className="text-gray-300 text-xs mb-1">커뮤니티 반응</div>
              <ProgressBar score={Number(news.community_sentiment)} />
            </div>
            <div className="flex-1">
              <div className="text-gray-300 text-xs mb-1">태그</div>
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const sym = t.toUpperCase();
                  const mks = assetsMap[sym] || {};
                  let aid: number | undefined;
                  if (news.news_category === "crypto") {
                    aid = mks["BINANCE"];
                  } else {
                    aid = mks[news.assets_market!.toUpperCase()];
                  }
                  if (!aid && Object.keys(mks).length === 1) {
                    aid = mks[Object.keys(mks)[0]];
                  }
                  return aid ? (
                    <Link
                      key={t}
                      to={`/asset/${aid}`}
                      className="bg-blue-600 px-3 py-1 rounded-full text-sm"
                    >
                      {t}
                    </Link>
                  ) : (
                    <span key={t} className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                      {t}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-2">AI 요약</h2>
            <div className="border-t border-gray-700 mb-4" />
            <p className="text-gray-200">{news.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="font-semibold text-white mb-2">긍정평가</h3>
              <div className="border-t border-gray-700 mb-4" />
              {positives.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-green-400">
                  {positives.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">해당 없음</p>
              )}
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="font-semibold text-white mb-2">부정평가</h3>
              <div className="border-t border-gray-700 mb-4" />
              {negatives.length > 0 ? (
                <ul className="list-disc list-inside space-y-1 text-red-400">
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

        {/* Right: chart + latest news */}
        <aside className="flex flex-col space-y-6">
          <div className="rounded-2xl overflow-hidden shadow-lg h-56 w-full">
            <TradingViewMiniChart symbol={tvSymbol} />
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">
              {news.assets_symbol
                ? news.news_category === "crypto"
                  ? `${news.assets_symbol.toUpperCase()}USDT`
                  : news.assets_symbol.toUpperCase()
                : "관련"}{" "}
              최신 뉴스
            </h4>
            <div className="flex flex-col gap-4">
              {latest.length > 0 ? (
                latest.map((item) => <NewsCard key={item.id} newsItem={item} variant="compact" />)
              ) : (
                <p className="text-gray-500">관련 뉴스 없음</p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Prev/Next */}
      <div className="max-w-screen-xl mx-auto py-6">
        <div className="flex justify-between items-center">
          <button
            disabled={!prevNews}
            onClick={() => prevNews && navigate(`/news/${prevNews.id}`)}
            className={`flex items-center px-4 py-2 rounded-lg bg-gray-800 hover:bg-blue-700 text-white font-semibold text-lg transition ${
              !prevNews ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            <span className="mr-2 text-2xl">←</span>이전 뉴스
          </button>
          <button
            disabled={!nextNews}
            onClick={() => nextNews && navigate(`/news/${nextNews.id}`)}
            className={`flex items-center px-4 py-2 rounded-lg bg-gray-800 hover:bg-blue-700 text-white font-semibold text-lg transition ${
              !nextNews ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            다음 뉴스<span className="ml-2 text-2xl">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsDetailPage;
