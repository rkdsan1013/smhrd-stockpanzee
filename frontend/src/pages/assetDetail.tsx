import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchAssetById } from "../services/assetService";
import { renderTradingViewChart, getTradingViewSymbol } from "../services/tradingViewService";

interface Asset {
  id: number;
  symbol: string;
  market: string;
  name: string;
  currentPrice: number;
  priceChange: number;
  marketCap: number;
}

type Tab = "chart" | "community";

const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [liveData, setLiveData] = useState<{ currentPrice: number; priceChange: number } | null>(
    null,
  );
  const [selectedTab, setSelectedTab] = useState<Tab>("chart");

  useEffect(() => {
    if (!id) return;
    fetchAssetById(Number(id))
      .then((a) => {
        setAsset(a);
        setLiveData({ currentPrice: a.currentPrice, priceChange: a.priceChange });
      })
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!asset || selectedTab !== "chart") return;
    const tvSymbol = getTradingViewSymbol(asset.symbol, asset.market);
    const containerId = `tv-chart-${asset.id}`;
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = "";
    renderTradingViewChart(containerId, tvSymbol);
  }, [asset?.id, selectedTab]);

  useEffect(() => {
    if (!asset) return;
    const timer = setInterval(() => {
      fetchAssetById(Number(id))
        .then((a) => setLiveData({ currentPrice: a.currentPrice, priceChange: a.priceChange }))
        .catch(console.error);
    }, 5000);
    return () => clearInterval(timer);
  }, [asset, id]);

  if (!asset || !liveData) {
    return <div className="text-white p-8">로딩 중…</div>;
  }

  const containerId = `tv-chart-${asset.id}`;
  const { currentPrice, priceChange } = liveData;
  const unit = asset.market === "Binance" ? "USDT" : "원";

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold">{asset.name}</h1>
          <span className="text-base md:text-lg text-gray-400">({asset.symbol})</span>
          <div className="mt-2 flex items-baseline space-x-4">
            <span className="text-xl md:text-2xl font-semibold">
              {currentPrice.toLocaleString()} {unit}
            </span>
            <span
              className={`text-lg md:text-xl font-semibold ${
                priceChange >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {priceChange >= 0 ? "+" : ""}
              {priceChange.toFixed(2)}%
            </span>
            <span className="text-sm text-gray-500">전일 종가 대비</span>
          </div>
        </div>
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

      {selectedTab === "chart" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-gray-800 rounded-2xl shadow-lg p-4">
            <div id={containerId} className="w-full h-80 md:h-[500px]" />
          </div>
          <aside className="space-y-4">
            <div className="bg-gray-800 rounded-2xl shadow p-4">
              <h2 className="text-lg font-semibold mb-2">실적 / 정보</h2>
              <p className="text-gray-400 text-sm">추후 개발 예정</p>
            </div>
            <div className="bg-gray-800 rounded-2xl shadow p-4">
              <h2 className="text-lg font-semibold mb-2">최근 뉴스</h2>
              <p className="text-gray-400 text-sm">추후 최신 뉴스 리스트</p>
            </div>
            <div className="bg-gray-800 rounded-2xl shadow p-4">
              <h2 className="text-lg font-semibold mb-2">과거 뉴스</h2>
              <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
                <li>과거 뉴스 제목 1</li>
                <li>과거 뉴스 제목 2</li>
              </ul>
            </div>
          </aside>
          <div className="md:col-span-3 bg-gray-700 rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-3">최신 뉴스 요약</h2>
            <p className="text-gray-300 text-base">여기에 뉴스 요약이 표시됩니다.</p>
          </div>
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
