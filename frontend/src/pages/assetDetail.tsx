// /frontend/src/pages/assetDetail.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchAssets } from "../services/assetService";
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

const AssetDetail: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();

  // symbol이 없으면 잘못된 접근 처리
  if (!symbol) {
    return <div className="text-white p-8">잘못된 접근입니다</div>;
  }

  const [asset, setAsset] = useState<Asset | null>(null);

  // 자산 데이터 로드
  useEffect(() => {
    fetchAssets()
      .then((list: Asset[]) => {
        const found = list.find((a) => a.symbol === symbol);
        setAsset(found ?? null);
      })
      .catch((err) => console.error("Asset fetch error:", err));
  }, [symbol]);

  // TradingView 차트 렌더링
  useEffect(() => {
    if (!asset) return;
    const tvSymbol = getTradingViewSymbol(asset.symbol, asset.market);
    const containerId = `tv-chart-${symbol.replace(/[:.]/g, "_")}`;
    renderTradingViewChart(containerId, tvSymbol);
  }, [asset, symbol]);

  // 아직 asset이 없으면 로딩 화면
  if (!asset) {
    return <div className="text-white p-8">로딩 중…</div>;
  }

  const containerId = `tv-chart-${symbol.replace(/[:.]/g, "_")}`;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">
        {asset.name} ({asset.symbol})
      </h1>
      <div id={containerId} className="w-full h-[500px]"></div>
    </div>
  );
};

export default AssetDetail;
