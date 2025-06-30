// frontend/src/pages/AssetDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchAssetById } from "../services/assetService";
import type { Asset } from "../services/assetService";
import { renderTradingViewChart, getTradingViewSymbol } from "../services/tradingViewService";
import { fetchLatestNewsByAsset, fetchNewsDetail } from "../services/newsService";
import type { NewsItem, NewsDetail } from "../services/newsService";

const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [liveData, setLiveData] = useState<{ currentPrice: number; priceChange: number } | null>(
    null,
  );
  const [selectedTab, setSelectedTab] = useState<"chart" | "community">("chart");
  const [latestNewsDetail, setLatestNewsDetail] = useState<NewsDetail | null>(null);
  const [latestNewsList, setLatestNewsList] = useState<NewsItem[]>([]);

  // 자산 정보 로드 및 초기 실시간 데이터 세팅
  useEffect(() => {
    if (!id) return;
    fetchAssetById(Number(id))
      .then((data) => {
        setAsset(data);
        setLiveData({ currentPrice: data.currentPrice, priceChange: data.priceChange });
      })
      .catch(console.error);
  }, [id]);

  // 최신 뉴스 1건(상세) + 다음 3건 리스트 로드
  useEffect(() => {
    if (!asset) return;
    fetchLatestNewsByAsset(asset.symbol)
      .then((news) => {
        if (news.length === 0) {
          setLatestNewsDetail(null);
          setLatestNewsList([]);
          return;
        }
        const [first, ...rest] = news;
        fetchNewsDetail(first.id)
          .then((detail) => setLatestNewsDetail(detail))
          .catch(console.error);
        setLatestNewsList(rest.slice(0, 3));
      })
      .catch(console.error);
  }, [asset]);

  // TradingView 차트 렌더링
  useEffect(() => {
    if (!asset || selectedTab !== "chart") return;
    const containerId = `tv-chart-${asset.id}`;
    const tvSymbol = getTradingViewSymbol(asset.symbol, asset.market);
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = "";
    renderTradingViewChart(containerId, tvSymbol);
  }, [asset?.id, selectedTab]);

  // 5초 단위 실시간 가격 갱신
  useEffect(() => {
    if (!asset) return;
    const interval = setInterval(() => {
      fetchAssetById(Number(id))
        .then((data) =>
          setLiveData({ currentPrice: data.currentPrice, priceChange: data.priceChange }),
        )
        .catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, [asset, id]);

  if (!asset || !liveData) {
    return <div className="text-white p-8 bg-gray-900 min-h-screen">로딩 중…</div>;
  }

  const { currentPrice, priceChange } = liveData;
  const unit = "원";
  const containerId = `tv-chart-${asset.id}`;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 space-y-6">
      {/* 헤더 */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-baseline space-x-2">
            <h1 className="text-2xl md:text-3xl font-bold">{asset.name}</h1>
            <span className="text-base md:text-lg text-gray-400">({asset.symbol})</span>
          </div>
          <div className="mt-2 flex items-baseline space-x-4">
            <span className="text-xl md:text-2xl font-semibold">
              {currentPrice.toLocaleString()} {unit}
            </span>
            <span
              className={`text-lg md:text-xl font-semibold ${priceChange >= 0 ? "text-green-400" : "text-red-400"}`}
            >
              {priceChange >= 0 && "+"}
              {priceChange.toFixed(2)}%
            </span>
            <span className="text-sm text-gray-500">전일 종가 대비</span>
          </div>
        </div>
        {/* 탭 바 */}
        <nav className="flex space-x-6 border-b border-gray-700">
          <button
            onClick={() => setSelectedTab("chart")}
            className={`pb-2 font-medium transition-colors ${
              selectedTab === "chart"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            차트/호가
          </button>
          <button
            onClick={() => setSelectedTab("community")}
            className={`pb-2 font-medium transition-colors ${
              selectedTab === "community"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            커뮤니티
          </button>
        </nav>
      </header>

      {/* 콘텐츠 */}
      {selectedTab === "chart" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 차트 + 최신 뉴스 상세 */}
          <div className="md:col-span-2 bg-gray-800 rounded-2xl shadow-lg p-4 space-y-4">
            <div id={containerId} className="w-full h-80 md:h-[500px]" />
            <div className="bg-gray-700 rounded-2xl shadow p-6">
              {latestNewsDetail ? (
                <>
                  <h2 className="text-xl font-semibold mb-2">{latestNewsDetail.title_ko}</h2>
                  <div className="text-gray-400 text-sm mb-4">
                    {new Date(latestNewsDetail.published_at).toLocaleString()}
                  </div>
                  <p className="text-gray-300">{latestNewsDetail.summary}</p>
                  <Link
                    to={`/news/${latestNewsDetail.id}`}
                    className="text-blue-400 underline mt-2 inline-block"
                  >
                    자세히 보기
                  </Link>
                </>
              ) : (
                <p className="text-gray-400">관련 뉴스 없음</p>
              )}
            </div>
          </div>

          {/* 다음 3건 리스트 */}
          <aside className="space-y-4">
            <div className="bg-gray-800 rounded-2xl shadow p-4">
              <h2 className="text-lg font-semibold mb-2">최신 뉴스</h2>
              <ul className="space-y-2">
                {latestNewsList.length > 0 ? (
                  latestNewsList.map((item) => (
                    <li key={item.id}>
                      <Link to={`/news/${item.id}`} className="block hover:underline">
                        <time className="text-gray-400 text-xs">
                          {new Date(item.published_at).toLocaleDateString()}
                        </time>
                        <p className="text-sm mt-1">{item.title_ko ?? item.title}</p>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 text-sm">관련 뉴스 없음</li>
                )}
              </ul>
            </div>
          </aside>
        </div>
      ) : (
        <section className="bg-gray-800 rounded-2xl shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-3">커뮤니티</h2>
          <p className="text-gray-400">커뮤니티 기능은 개발 후 이용 가능합니다.</p>
        </section>
      )}
    </div>
  );
};

export default AssetDetail;
