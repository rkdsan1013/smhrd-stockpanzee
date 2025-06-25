// frontend/src/pages/NewsDetail.tsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchNewsDetail, fetchLatestNewsByAsset } from "../services/newsService";
import type { NewsDetail, NewsItem } from "../services/newsService";
import { TradingViewMiniChart } from "../components/Chart/TradingViewMiniChart";
import { getTradingViewSymbol } from "../services/tradingViewService";

const MAX_LATEST = 5;
const sentimentLabels = ["매우 부정", "부정", "중립", "긍정", "매우 긍정"];
const sentimentColor = (score: number) =>
  score <= 2 ? "bg-red-500" : score === 3 ? "bg-yellow-400" : "bg-green-500";

const ProgressBar: React.FC<{ score?: number }> = ({ score }) => {
  if (score == null || isNaN(score)) {
    return <span className="text-gray-400 text-sm">데이터 없음</span>;
  }
  const valid = Math.max(1, Math.min(5, score));
  return (
    <div className="flex items-center space-x-2">
      <div className={`h-2 w-32 rounded-full ${sentimentColor(valid)}`} />
      <span className="text-sm font-bold text-white">{sentimentLabels[valid - 1]}</span>
    </div>
  );
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
        if (data.tags?.length) {
          return fetchLatestNewsByAsset(data.tags[0], data.id);
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

  const tvSymbol =
    news.assets_symbol && news.assets_market
      ? getTradingViewSymbol(news.assets_symbol, news.assets_market)
      : "";

  return (
    <div className="w-full bg-gray-900 px-6 py-8">
      <div className="max-w-screen-xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* 좌측 메인 콘텐츠 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 헤더 */}
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

          {/* 감정평가 */}
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

          {/* AI 요약 */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="font-bold text-xl text-white mb-2">AI 요약</h2>
            <div className="border-t border-gray-700 mb-4" />
            <p className="text-gray-200">{news.summary}</p>
          </div>

          {/* 긍/부정 평가 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">긍정평가</h3>
              <div className="border-t border-gray-700 mb-4" />
              <p className="text-green-400">{news.news_positive || "해당 없음"}</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-white mb-2">부정평가</h3>
              <div className="border-t border-gray-700 mb-4" />
              <p className="text-red-400">{news.news_negative || "해당 없음"}</p>
            </div>
          </div>
        </div>

        {/* 우측 사이드바 */}
        <aside className="space-y-6">
          {/* 차트 */}
          <div className="bg-gray-800 rounded-xl p-4 h-56 flex items-center justify-center">
            <TradingViewMiniChart symbol={tvSymbol} />
          </div>

          {/* 최신 뉴스 */}
          <div className="bg-gray-800 rounded-xl p-4">
            <h4 className="text-white font-bold mb-4">{news.tags?.[0] || "종목"} 최신 뉴스</h4>
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
// frontend/src/pages/NewsDetail.tsx
