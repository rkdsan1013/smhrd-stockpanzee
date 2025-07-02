// /frontend/src/pages/AssetDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import type { Asset } from "../services/assetService";
import { fetchAssetById } from "../services/assetService";
import type { NewsItem } from "../services/newsService";
import { fetchLatestNewsByAsset } from "../services/newsService";
import { renderTradingViewChart, getTradingViewSymbol } from "../services/tradingViewService";
import NewsCard from "../components/NewsCard";
import AssetComments from "../components/AssetComments";

const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        올바르지 않은 요청입니다.
      </div>
    );
  }
  const assetId = Number(id);

  const [asset, setAsset] = useState<Asset | null>(null);
  const [liveData, setLiveData] = useState<{ currentPrice: number; priceChange: number } | null>(
    null,
  );
  const [detailNews, setDetailNews] = useState<NewsItem | null>(null);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<"chart" | "community">("chart");

  // parse tags helper
  const parseTags = (tags: string | string[] | null): string[] => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === "string") {
      try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  };

  // sentiment helper
  const SENT_LABELS = ["매우 부정", "부정", "중립", "긍정", "매우 긍정"] as const;
  function getSentiment(v: number | string | null) {
    const x = Math.min(5, Math.max(1, Number(v) || 3));
    const label = SENT_LABELS[x - 1];
    const style =
      x <= 2
        ? "bg-red-600 text-white"
        : x === 3
          ? "bg-gray-600 text-white"
          : "bg-green-600 text-white";
    return { label, style };
  }

  // 1) 자산 정보 로드
  useEffect(() => {
    fetchAssetById(assetId)
      .then((data) => {
        setAsset(data);
        setLiveData({ currentPrice: data.currentPrice, priceChange: data.priceChange });
      })
      .catch(console.error);
  }, [assetId]);

  // 2) 뉴스 1건 + 다음 5건
  useEffect(() => {
    if (!asset) return;
    const category: "domestic" | "international" | "crypto" = asset.market.includes("KRX")
      ? "domestic"
      : /NASDAQ|NYSE/.test(asset.market)
        ? "international"
        : "crypto";

    fetchLatestNewsByAsset(asset.symbol)
      .then((list) => {
        if (list.length === 0) {
          setDetailNews(null);
          setNewsList([]);
          return;
        }
        const fix = (item: any) => ({
          ...item,
          category,
          sentiment: item.news_sentiment ?? item.sentiment,
        });
        const [first, ...rest] = list;
        setDetailNews(fix(first));
        setNewsList(rest.slice(0, 5).map(fix));
      })
      .catch(console.error);
  }, [asset]);

  // 3) TradingView 차트 렌더링
  useEffect(() => {
    if (!asset || selectedTab !== "chart") return;
    const containerId = `tv-chart-${asset.id}`;
    const tvSymbol = getTradingViewSymbol(asset.symbol, asset.market);
    const el = document.getElementById(containerId);
    if (el) {
      el.innerHTML = "";
      renderTradingViewChart(containerId, tvSymbol);
    }
  }, [asset, selectedTab]);

  // 4) 5초마다 실시간 가격 업데이트
  useEffect(() => {
    if (!asset) return;
    const timer = setInterval(() => {
      fetchAssetById(assetId)
        .then((data) =>
          setLiveData({ currentPrice: data.currentPrice, priceChange: data.priceChange }),
        )
        .catch(console.error);
    }, 5000);
    return () => clearInterval(timer);
  }, [asset, assetId]);

  if (!asset || !liveData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        로딩 중…
      </div>
    );
  }

  const { currentPrice, priceChange } = liveData;
  const chartContainerId = `tv-chart-${asset.id}`;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {asset.name} ({asset.symbol})
          </h1>
          <div className="mt-1 text-xl md:text-2xl font-semibold">
            {currentPrice.toLocaleString()}원{" "}
            <span className={priceChange >= 0 ? "text-green-400" : "text-red-400"}>
              {priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
        <nav className="flex space-x-6 border-b border-gray-700">
          <button
            onClick={() => setSelectedTab("chart")}
            className={`pb-2 font-medium ${
              selectedTab === "chart"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            차트/뉴스
          </button>
          <button
            onClick={() => setSelectedTab("community")}
            className={`pb-2 font-medium ${
              selectedTab === "community"
                ? "text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-white"
            }`}
          >
            커뮤니티
          </button>
        </nav>
      </header>

      {/* Content */}
      {selectedTab === "chart" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start md:items-stretch">
          {/* Chart + Detail */}
          <div className="md:col-span-2 flex flex-col space-y-6">
            <div className="bg-gray-800 rounded-2xl shadow-lg p-4 flex-shrink-0">
              <div id={chartContainerId} className="w-full h-80 md:h-[500px]" />
            </div>
            <div className="bg-gray-700 rounded-2xl shadow p-6 flex flex-col h-full">
              {detailNews ? (
                <>
                  <h2 className="text-xl font-semibold mb-2">
                    {detailNews.title_ko || detailNews.title}
                  </h2>
                  <div className="text-gray-400 text-sm mb-4">
                    {new Date(detailNews.published_at).toLocaleString()}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(() => {
                      const { label, style } = getSentiment(detailNews.sentiment);
                      return (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${style}`}>
                          {label}
                        </span>
                      );
                    })()}
                    {parseTags(detailNews.tags).map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 flex-grow">{detailNews.summary}</p>
                  <Link to={`/news/${detailNews.id}`} className="mt-auto text-blue-400 underline">
                    자세히 보기
                  </Link>
                </>
              ) : (
                <p className="text-gray-400">관련 뉴스가 없습니다.</p>
              )}
            </div>
          </div>

          {/* Latest News List */}
          <aside className="grid gap-4">
            {newsList.length > 0 ? (
              newsList.map((item) => (
                <div key={item.id} className="h-full">
                  <NewsCard newsItem={item} variant="compact" />
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center">관련 뉴스가 없습니다.</p>
            )}
          </aside>
        </div>
      ) : (
        <section className="bg-gray-800 rounded-2xl shadow p-6">
          <AssetComments assetId={asset.id} />
        </section>
      )}
    </div>
  );
};

export default AssetDetail;
