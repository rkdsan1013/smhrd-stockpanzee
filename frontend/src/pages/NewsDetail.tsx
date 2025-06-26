// frontend/src/pages/NewsDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchNewsDetail, fetchLatestNewsByAsset } from "../services/newsService";
import type { NewsDetail, NewsItem } from "../services/newsService";
import { TradingViewMiniChart } from "../components/Chart/TradingViewMiniChart";
import { getTradingViewSymbol } from "../services/tradingViewService";

const MAX_LATEST = 5;
const sentimentLabels = ["매우 부정", "부정", "중립", "긍정", "매우 긍정"];
const stepColors = ["bg-red-500", "bg-orange-500", "bg-yellow-400", "bg-blue-400", "bg-green-500"];

/** 5칸 분리된 게이지 */
const ProgressBar: React.FC<{ score?: number }> = ({ score }) => {
  if (score == null || isNaN(score)) {
    return <span className="text-gray-400 text-sm">데이터 없음</span>;
  }
  const valid = Math.max(1, Math.min(5, Math.round(score)));
  const total = 5;
  const fillColor = stepColors[valid - 1];

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex h-2 w-32 space-x-[2px]">
        {Array.from({ length: total }).map((_, i) => {
          const bgClass = i < valid ? fillColor : "bg-gray-700";
          const leftRadius = i === 0 ? "rounded-l-full" : "";
          const rightRadius = i === total - 1 ? "rounded-r-full" : "";
          return <div key={i} className={`flex-1 ${bgClass} ${leftRadius} ${rightRadius}`} />;
        })}
      </div>
      <span className="text-sm font-bold text-white">{sentimentLabels[valid - 1]}</span>
    </div>
  );
};

/** JSON 문자열 또는 배열 → 배열로 변환 */
const parseList = (val: string | string[] | undefined): string[] => {
  if (Array.isArray(val)) return val;
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [latest, setLatest] = useState<NewsItem[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!id) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    fetchNewsDetail(+id)
      .then((data) => {
        setNews(data);
        if (data.assets_symbol) {
          return fetchLatestNewsByAsset(data.assets_symbol, data.id);
        }
        return Promise.resolve([]);
      })
      .then((list) => {
        setLatest(list.slice(0, MAX_LATEST));
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, [id]);

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

  // TradingView 심볼
  const tvSymbol = news.assets_symbol
    ? news.news_category === "crypto"
      ? `BINANCE:${news.assets_symbol.toUpperCase()}USDT`
      : getTradingViewSymbol(news.assets_symbol, news.assets_market!)
    : "";

  // 긍/부정 배열 파싱
  const positives = parseList(news.news_positive);
  const negatives = parseList(news.news_negative);

  return (
    <div className="w-full bg-gray-900 px-6 py-8">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main */}
        <div className="lg:col-span-3 space-y-6">
          {/* Header */}
          <div className="bg-gray-800 rounded-xl p-6 flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2 break-words">{news.title_ko}</h1>
              <div className="text-gray-400 text-sm flex flex-wrap gap-2">
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
            {news.thumbnail && (
              <img
                src={news.thumbnail}
                alt="뉴스 썸네일"
                className="w-full max-w-xs h-40 object-cover rounded-xl"
              />
            )}
          </div>

          {/* Sentiment Bars */}
          <div className="bg-gray-800 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-6">
            <div>
              <div className="text-gray-300 text-xs mb-1">AI 감정평가</div>
              <ProgressBar score={news.news_sentiment} />
            </div>
            <div>
              <div className="text-gray-300 text-xs mb-1">커뮤니티 반응</div>
              <ProgressBar score={Number(news.community_sentiment)} />
            </div>
            <div>
              <div className="text-gray-300 text-xs mb-1">태그</div>
              <div className="flex flex-wrap gap-2">
                {(news.tags || []).map((t) => (
                  <span key={t} className="bg-blue-700 text-white px-3 py-1 rounded-full text-xs">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="font-bold text-xl text-white mb-2">AI 요약</h2>
            <div className="border-t border-gray-700 mb-4" />
            <p className="text-gray-200">{news.summary}</p>
          </div>

          {/* Positive / Negative */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">긍정평가</h3>
              <div className="border-t border-gray-700 mb-4" />
              {positives.length > 0 ? (
                <ul className="list-disc list-inside pl-4 text-green-400 space-y-1">
                  {positives.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">해당 없음</p>
              )}
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">부정평가</h3>
              <div className="border-t border-gray-700 mb-4" />
              {negatives.length > 0 ? (
                <ul className="list-disc list-inside pl-4 text-red-400 space-y-1">
                  {negatives.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">해당 없음</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Chart */}
          <div className="bg-gray-800 rounded-xl p-4 h-56 flex items-center justify-center">
            <TradingViewMiniChart symbol={tvSymbol} />
          </div>

          {/* Latest News */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h4 className="text-white font-bold mb-4">
              {news.assets_symbol
                ? news.news_category === "crypto"
                  ? `${news.assets_symbol.toUpperCase()}USDT`
                  : news.assets_symbol.toUpperCase()
                : "종목"}{" "}
              최신 뉴스
            </h4>
            <ul className="space-y-3">
              {latest.length === 0 ? (
                <li className="text-gray-500">관련 뉴스 없음</li>
              ) : (
                latest.map((item) => (
                  <li key={item.id}>
                    <Link to={`/news/${item.id}`} className="block hover:underline">
                      <time className="text-gray-400 text-xs">
                        {new Date(item.published_at).toLocaleDateString()}
                      </time>
                      <p className="text-white text-sm mt-1">{item.title_ko ?? item.title}</p>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default NewsDetailPage;
