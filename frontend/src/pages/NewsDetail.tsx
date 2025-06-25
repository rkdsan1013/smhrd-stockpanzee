//frontend/src/pages/NewsDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchNewsDetail, fetchLatestNewsByAsset } from "../services/newsService";
import type { NewsDetail, NewsItem } from "../services/newsService";
import { TradingViewMiniChart } from "../components/Chart/TradingViewMiniChart";
import { getTradingViewSymbol } from "../services/tradingViewService";

// 감정 점수별 텍스트/색상 매핑
const sentimentMap = [
  "매우 부정", "부정", "중립", "긍정", "매우 긍정"
];
const sentimentBarColor = (sentiment: number) => {
  if (sentiment <= 2) return "bg-red-500";
  if (sentiment === 3) return "bg-yellow-400";
  if (sentiment >= 4) return "bg-green-500";
  return "bg-gray-400";
};

const PAGE_SIZE = 5;

// Pagination helper
function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
function getPagination(current: number, total: number, max = 5): (number | string)[] {
  if (total <= max) return range(1, total);
  const delta = Math.floor(max / 2);
  let start = Math.max(2, current - delta);
  let end = Math.min(total - 1, current + delta);

  if (current <= delta + 1) { start = 2; end = max; }
  if (current >= total - delta) { start = total - max + 1; end = total - 1; }

  const pages: (number | string)[] = [1];
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; ++i) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}




// HorizonBar
const HorizonBar = () => (
  <div
    style={{
      width: "100%",
      height: 2,
      background: "linear-gradient(90deg,rgb(112, 112, 112), rgb(255, 255, 255))",
      opacity: 0.6,
      margin: "10px 0 16px 0"
    }}
  />
);

const NewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [news, setNews] = useState<NewsDetail | null>(null);
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!id) {
      setError("잘못된 접근입니다.");
      setLoading(false);
      setNews(null);
      setLatestNews([]);
      return;
    }
    setLoading(true);
    setError(null);
    setPage(1); // 뉴스 ID 바뀌면 1페이지부터

    fetchNewsDetail(Number(id))
      .then((data) => {
        setNews(data);
        // 태그가 있으면 첫 번째 태그로 최신뉴스 검색
        if (data.tags && Array.isArray(data.tags) && data.tags.length > 0) {
          fetchLatestNewsByAsset(data.tags[0], data.id).then(setLatestNews);
        } else {
          setLatestNews([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setNews(null);
        setLatestNews([]);
        setError("뉴스를 찾을 수 없습니다.");
        setLoading(false);
      });
  }, [id]);

  const pageCount = Math.ceil(latestNews.length / PAGE_SIZE);
  const pagedNews = latestNews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  //const pagination = getPagination(page, pageCount, 5);

  // 에러·로딩 처리
  if (loading) return <div className="p-12 text-center text-white">로딩 중…</div>;
  if (error) return <div className="p-12 text-center text-red-400">{error}</div>;
  if (!news) return null;

  // 안전하게 변수 꺼내기
  //const sentimentLabel = sentimentMap[Math.max(0, Math.min(4, (news.news_sentiment ?? 3) - 1))];

  // 값 추출(정수여부 확인, 기본값 3)
  const aiSentiment = Math.max(1, Math.min(5, news.news_sentiment ?? 3));
  const aiSentimentLabel = sentimentMap[aiSentiment - 1];

  const commuSentiment = Number(news.community_sentiment);
  const commuSentimentValid = !isNaN(commuSentiment) && commuSentiment >= 1 && commuSentiment <= 5;
  const commuSentimentLabel = commuSentimentValid ? sentimentMap[commuSentiment - 1] : "데이터 없음";

  // tags - assets 심볼 매칭

  const tvSymbol =
    news.assets_market && news.assets_symbol
      ? getTradingViewSymbol(news.assets_symbol, news.assets_market)
      : "";


 return (
  <div className="min-h-screen flex justify-center items-start  p-[3px]">
    <div className="w-full max-w-[1300px] rounded-xl bg-[#181a20]">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 px-3 py-3">
        {/* 메인 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 뉴스 헤더 */}
          <div className="rounded-xl p-4 mb-1 flex flex-row gap-6 items-stretch border border-[#33363f] bg-[#181a20]">
  {/* 텍스트 영역: 세로 분할(제목/나머지) */}
  <div className="flex flex-col justify-between flex-1 min-w-0" style={{ minHeight: "128px" }}>
    {/* 제목(위) */}
    <h1 className="text-2xl font-bold mb-2 break-words">{news.title_ko}</h1>
    {/* 기타 정보(아래) */}
    <div className="flex items-center space-x-3 text-sm text-gray-400 flex-wrap">
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
        뉴스 원문보기
      </a>
    </div>
  </div>
  {/* 썸네일 */}
  {news.thumbnail && (
    <img
      src={news.thumbnail}
      alt="뉴스 이미지"
      className="w-52 h-32 object-cover rounded-xl flex-shrink-0"
      style={{ minWidth: "208px", minHeight: "128px", maxHeight: "128px" }}
    />
  )}
</div>


          {/* AI 감정평가/반응 바 */}
         <div className="flex items-center space-x-8 rounded-xl p-3 mb-1 border border-[#33363f] bg-transparent">
          {/* AI 감정평가 */}
          <div>
            <div className="text-xs text-gray-300">AI 감정평가</div>
            <div className="flex items-center space-x-1 mt-1">
              <div className={`h-2 w-32 rounded-full ${sentimentBarColor(aiSentiment)}`} />
              <span className="ml-2 text-sm font-bold">{aiSentimentLabel}</span>
            </div>
          </div>
          {/* 커뮤니티 반응 시각화 */}
          <div>
            <div className="text-xs text-gray-300">커뮤니티 반응</div>
            {commuSentimentValid ? (
              <div className="flex items-center space-x-1 mt-1">
                <div className={`h-2 w-32 rounded-full ${sentimentBarColor(commuSentiment)}`} />
                <span className="ml-2 text-sm font-bold">{commuSentimentLabel}</span>
              </div>
            ) : (
              <span className="text-gray-400 font-semibold text-sm">아직 없음</span>
            )}
          </div>
          {/* 태그 */}
          <div>
            <div className="text-xs text-gray-300">태그</div>
            <div className="flex gap-1 flex-wrap">
              {(news.tags || []).map((tag, i) => (
                <span key={i} className="bg-blue-700 rounded-full px-2 py-0.5 text-xs">{tag}</span>
              ))}
            </div>
          </div>
        </div>


          {/* AI 요약 */}
          <section>
            <div className="rounded-xl p-4 mb-1 flex flex-col items-center text-center border border-[#33363f]">
              <div className="font-bold text-lg mb-1 w-full flex flex-col items-center">
                <span>AI 요약</span>
                <HorizonBar />
              </div>
              <div className="text-gray-100 text-left w-full">{news.summary}</div>
            </div>
          </section>

          {/* 긍/부정 평가 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            <div className="rounded-xl p-4 flex flex-col items-center text-center border border-[#33363f]">
              <div className="font-semibold mb-1 w-full flex flex-col items-center">
                <span>긍정평가</span>
                <HorizonBar />
              </div>
              <div className="text-green-400 text-left w-full">{news.news_positive || "해당 없음"}</div>
            </div>
            <div className="rounded-xl p-4 flex flex-col items-center text-center border border-[#33363f]">
              <div className="font-semibold mb-1 w-full flex flex-col items-center">
                <span>부정평가</span>
                <HorizonBar />
              </div>
              <div className="text-red-400 text-left w-full">{news.news_negative || "해당 없음"}</div>
            </div>
          </div>
        </div>

        {/* 우측 패널 */}
        <aside className="lg:col-span-1 flex flex-col space-y-6">
          {/* 트레이딩뷰 차트 */}
          <div className="rounded-xl p-3 flex items-center justify-center border border-[#33363f]" style={{ minHeight: 220 }}>
            {news?.tags && news.tags[0]
              ? <TradingViewMiniChart symbol={tvSymbol} />
              : <TradingViewMiniChart />
            }
          </div>
          {/* 최신 뉴스 리스트 + 페이지네이션 */}
          <div className="rounded-xl p-3 border border-[#33363f]">
            <div className="font-bold mb-2">{news.tags?.[0] || "종목"} 최신 뉴스</div>
            <ul className="text-sm text-gray-200 space-y-1">
              {pagedNews.length === 0 && (
                <li className="text-gray-500">관련 뉴스 없음</li>
              )}
              {pagedNews.map((item) => (
                <li key={item.id}>
                  <Link to={`/news/${item.id}`} className="hover:underline">
                    <span className="text-gray-400 mr-1">
                      {new Date(item.published_at).toLocaleDateString()}
                    </span>
                    <br />
                    {item.title_ko ?? item.title}
                  </Link>
                </li>
              ))}
            </ul>
            {/* 페이지네이션 */}
            {pageCount > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 rounded text-xs bg-gray-700 disabled:opacity-30"
                >
                  &lt;
                </button>
                {getPagination(page, pageCount).map((p, idx) =>
                  typeof p === "number" ? (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-2 py-1 rounded text-xs ${page === p ? "bg-blue-600 font-bold" : "bg-gray-700"}`}
                      disabled={page === p}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
                  )
                )}
                <button
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                  className="px-2 py-1 rounded text-xs bg-gray-700 disabled:opacity-30"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  </div>
);

};

export default NewsDetailPage;
