import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  fetchAssetById,
  fetchAssets,
  getAssetDictSync,
  type Asset,
} from "../services/assetService";
import type { NewsItem } from "../services/newsService";
import { fetchLatestNewsByAsset } from "../services/newsService";
import { renderTradingViewChart, getTradingViewSymbol } from "../services/tradingViewService";
import NewsCard from "../components/NewsCard";
import AssetComments from "../components/AssetComments";
import Icons from "../components/Icons";
import { fetchFavorites, addFavorite, removeFavorite } from "../services/favoriteService";
import AssetDetailSkeleton from "../components/skeletons/AssetDetailSkeleton";

const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  /* ───────── 파라미터 검증 ───────── */
  if (!id || Number.isNaN(Number(id))) {
    return (
      <div className="min-h-screen flex flex-col gap-6 items-center justify-center bg-gray-900 text-white">
        <p>올바르지 않은 요청입니다.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition"
        >
          뒤로가기
        </button>
      </div>
    );
  }
  const assetId = Number(id);

  /* ───────── 상태 ───────── */
  const [asset, setAsset] = useState<Asset | null>(null);
  const [liveData, setLiveData] = useState<{
    currentPrice: number;
    priceChange: number;
  } | null>(null);
  const [detailNews, setDetailNews] = useState<NewsItem | null>(null);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<"chart" | "community">("chart");
  const [isFavorite, setIsFavorite] = useState(false);

  /* ───────── 심볼 → Asset 딕셔너리 (메모리 + localStorage) ───────── */
  const dictRef = React.useRef<Record<string, Asset>>(getAssetDictSync());
  const [dictReady, setDictReady] = useState(Object.keys(dictRef.current).length > 0);

  useEffect(() => {
    if (!dictReady) {
      fetchAssets().then(() => {
        dictRef.current = getAssetDictSync();
        setDictReady(true); // 재렌더
      });
    }
  }, [dictReady]);

  /* ───────── 공통 유틸 ───────── */
  const parseTags = (tags: string | string[] | null): string[] => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags === "string") {
      try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        /* ignore */
      }
    }
    return [];
  };

  const SENT_LABELS = ["매우 부정", "부정", "중립", "긍정", "매우 긍정"] as const;
  function getSentiment(v: number | string | null) {
    const num = Number(v);
    const x = Math.min(5, Math.max(1, Number.isNaN(num) ? 3 : num));
    const label = SENT_LABELS[x - 1];
    const style =
      x <= 2
        ? "bg-red-600 text-white"
        : x === 3
          ? "bg-gray-600 text-white"
          : "bg-green-600 text-white";
    return { label, style };
  }

  /* ───────── 즐겨찾기 로드 ───────── */
  useEffect(() => {
    fetchFavorites()
      .then((list) => setIsFavorite(list.includes(assetId)))
      .catch(console.error);
  }, [assetId]);

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await removeFavorite(assetId);
        setIsFavorite(false);
      } else {
        await addFavorite(assetId);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ───────── 자산 정보 로드 ───────── */
  useEffect(() => {
    fetchAssetById(assetId)
      .then((data) => {
        setAsset(data);
        setLiveData({
          currentPrice: data.currentPrice,
          priceChange: data.priceChange,
        });
      })
      .catch(console.error);
  }, [assetId]);

  /* ───────── 뉴스 로드 ───────── */
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

  /* ───────── TradingView 차트 ───────── */
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

  /* ───────── 실시간 가격 갱신 ───────── */
  useEffect(() => {
    if (!asset) return;
    const timer = setInterval(() => {
      fetchAssetById(assetId)
        .then((data) =>
          setLiveData({
            currentPrice: data.currentPrice,
            priceChange: data.priceChange,
          }),
        )
        .catch(console.error);
    }, 5000);
    return () => clearInterval(timer);
  }, [asset, assetId]);

  /* ───────── 초기 스켈레톤 ───────── */
  if (!asset || !liveData) {
    return <AssetDetailSkeleton />;
  }

  const { currentPrice, priceChange } = liveData;
  const chartContainerId = `tv-chart-${asset.id}`;

  /* ───────── Render ───────── */
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 space-y-8">
      {/* ------------- 헤더 ------------- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleFavorite}
              aria-label={isFavorite ? "즐겨찾기에서 제거" : "즐겨찾기에 추가"}
              className="focus:outline-none"
            >
              <Icons
                name="banana"
                className={`w-5 h-5 md:w-6 md:h-6 ${
                  isFavorite ? "text-yellow-400" : "text-gray-500"
                }`}
              />
            </button>
            <h1 className="flex items-center space-x-2 text-2xl md:text-3xl font-bold">
              <span>{asset.name}</span>
              <span className="text-lg md:text-xl font-medium text-gray-400">({asset.symbol})</span>
            </h1>
          </div>
          <div className="flex items-baseline space-x-3 mt-3">
            <span className="text-2xl md:text-3xl font-semibold">
              {currentPrice.toLocaleString()}원
            </span>
            <span
              className={`text-base md:text-lg font-medium ${
                priceChange >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {priceChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* ------------- 탭 ------------- */}
        <nav className="flex space-x-6 border-b border-gray-700 pt-2">
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
            토론방
          </button>
        </nav>
      </header>

      {/* ------------- 본문 ------------- */}
      {selectedTab === "chart" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* -------- 차트 & 최신 뉴스 -------- */}
          <div className="md:col-span-2 flex flex-col space-y-6">
            <div className="rounded-2xl shadow-lg overflow-hidden border border-gray-700">
              <div id={chartContainerId} className="w-full h-80 md:h-[500px]" />
            </div>

            <div className="text-xl md:text-2xl font-bold">{asset.name} 최신 뉴스</div>

            {detailNews ? (
              <div className="bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col space-y-4 hover:shadow-xl transition">
                <h2 className="text-2xl font-semibold leading-snug">
                  {detailNews.title_ko || detailNews.title}
                </h2>

                {/* ───── 뉴스 태그 (회사명) ───── */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`${getSentiment(detailNews.sentiment).style} px-3 py-1 text-sm rounded-full`}
                  >
                    {getSentiment(detailNews.sentiment).label}
                  </span>

                  {/* 심볼 → 회사명 매핑 */}
                  {dictReady &&
                    parseTags(detailNews.tags).map((sym) => {
                      const a = dictRef.current[sym];
                      if (!a) return null;
                      return (
                        <Link
                          key={sym}
                          to={`/asset/${a.id}`}
                          className="px-2 py-1 text-sm bg-blue-600 rounded-full hover:bg-blue-500 transition"
                        >
                          {a.name}
                        </Link>
                      );
                    })}
                </div>

                <p
                  className="text-gray-300 overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {detailNews.summary}
                </p>
                <div className="flex justify-between items-start mt-4">
                  <div className="flex flex-col text-gray-400 text-sm">
                    <span>{detailNews.publisher}</span>
                    <span className="mt-1">
                      {new Date(detailNews.published_at).toLocaleString()}
                    </span>
                  </div>
                  <Link to={`/news/${detailNews.id}`} className="text-blue-400 hover:underline">
                    자세히 보기 →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-center">관련 뉴스가 없습니다.</p>
            )}
          </div>

          {/* -------- 관련 뉴스 리스트 -------- */}
          <aside className="flex flex-col">
            <div className="text-xl md:text-2xl font-bold mb-4">{asset.name} 관련 뉴스</div>
            <div className="flex flex-col gap-4">
              {newsList.length > 0 ? (
                newsList.map((item) => <NewsCard key={item.id} newsItem={item} variant="compact" />)
              ) : (
                <p className="text-gray-400 text-center">관련 뉴스가 없습니다.</p>
              )}
            </div>
          </aside>
        </div>
      ) : (
        /* -------- 토론방 -------- */
        <section className="bg-gray-800 rounded-2xl shadow p-6">
          <AssetComments assetId={asset.id} />
        </section>
      )}
    </div>
  );
};

export default AssetDetail;
