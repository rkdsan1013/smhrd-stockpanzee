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
  const [asset, setAsset] = useState<Asset | null>(null);
  const [liveData, setLiveData] = useState<{ currentPrice: number; priceChange: number } | null>(
    null,
  );
  const [detailNews, setDetailNews] = useState<NewsItem | null>(null);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<"chart" | "community">("chart");

  // 자산 정보 및 초기 실시간 데이터
  useEffect(() => {
    if (!id) return;
    fetchAssetById(Number(id))
      .then((data) => {
        setAsset(data);
        setLiveData({ currentPrice: data.currentPrice, priceChange: data.priceChange });
      })
      .catch(console.error);
  }, [id]);

  // 최신 뉴스 1건 + 다음 5건 로드
 useEffect(() => {
  if (!asset) return;

  const determineCategory = (market: string): "domestic" | "international" | "crypto" => {
    if (market.includes("KRX")) return "domestic";
    if (market.includes("NASDAQ") || market.includes("NYSE")) return "international";
    return "crypto";
  };

  const assetCategory = determineCategory(asset.market);
    fetchLatestNewsByAsset(asset.symbol)
      .then((list) => {
        if (list.length === 0) {
          setDetailNews(null);
          setNewsList([]);
        } else {
          const [first, ...rest] = list;
          // 여기서 news_sentiment → sentiment로 강제 매핑
          const fixField = (item: any) => ({
            ...item,
            category: assetCategory,
            sentiment: item.news_sentiment ?? item.sentiment, // 둘 다 없는 경우는 undefined
          });
          setDetailNews(fixField(first));
          setNewsList(rest.slice(0, 5).map(fixField));
        }
      })
      .catch(console.error);
  }, [asset]);

  // TradingView 차트 렌더링
  useEffect(() => {
    if (!asset || selectedTab !== "chart") return;
    const containerId = `tv-chart-${asset.id}`;
    const tvSymbol = getTradingViewSymbol(asset.symbol, asset.market);
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = "";
      renderTradingViewChart(containerId, tvSymbol);
    }
  }, [asset, selectedTab]);

  // 5초마다 실시간 가격 업데이트
  useEffect(() => {
    if (!asset) return;
    const timer = setInterval(() => {
      fetchAssetById(Number(id))
        .then((data) =>
          setLiveData({ currentPrice: data.currentPrice, priceChange: data.priceChange }),
        )
        .catch(console.error);
    }, 5000);
    return () => clearInterval(timer);
  }, [asset, id]);

  // Parse tags for detailNews
  const parseTags = (tags: string | string[] | null): string[] => {
    let parsedTags: string[] = [];
    if (Array.isArray(tags)) {
      parsedTags = tags;
    } else if (typeof tags === "string") {
      try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) {
          parsedTags = parsed;
        }
      } catch {
        // Handle invalid JSON gracefully
      }
    }
    return parsedTags;
  };

  // Get sentiment label and style
  const SENT_LABELS = ["매우 부정", "부정", "중립", "긍정", "매우 긍정"];
  const getSentiment = (v: number | string | null): { label: string; style: string } => {
    const x = Math.min(5, Math.max(1, Number(v) || 3));
    return {
      label: SENT_LABELS[x - 1],
      style:
        x <= 2
          ? "bg-red-600 text-white"
          : x === 3
            ? "bg-gray-600 text-white"
            : "bg-green-600 text-white",
    };
  };

  if (!asset || !liveData) {
    return <div className="text-white p-8 bg-gray-900 min-h-screen">로딩 중…</div>;
  }

  const { currentPrice, priceChange } = liveData;
  const containerId = `tv-chart-${asset.id}`;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 space-y-6">
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
            우끼끼
          </button>
        </nav>
      </header>

      {/* Content */}
      {selectedTab === "chart" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chart + Detail Summary */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-gray-800 rounded-2xl shadow-lg p-4">
              <div id={containerId} className="w-full h-80 md:h-[500px]" />
            </div>
            <div className="bg-gray-700 rounded-2xl shadow p-6">
              {detailNews ? (
                <>
                  <h2 className="text-xl font-semibold mb-2">
                    {detailNews.title_ko || detailNews.title}
                  </h2>
                  <div className="text-gray-400 text-sm mb-2">
                    {new Date(detailNews.published_at).toLocaleString()}
                  </div>
                  {/* Sentiment and Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getSentiment(detailNews.sentiment).style}`}
                    >
                      {getSentiment(detailNews.sentiment).label}
                    </span>
                    {parseTags(detailNews.tags).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-600 text-white"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4">{detailNews.summary}</p>
                  <Link to={`/news/${detailNews.id}`} className="text-blue-400 underline">
                    자세히 보기
                  </Link>
                </>
              ) : (
                <p className="text-gray-400">관련 뉴스 없음</p>
              )}
            </div>
          </div>

          {/* Side Latest News Cards */}
          <aside className="space-y-4">
            {newsList.length > 0 ? (
              newsList.map((item) => <NewsCard key={item.id} newsItem={item} variant="compact" />)
            ) : (
              <p className="text-gray-400 text-sm">관련 뉴스 없음</p>
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
