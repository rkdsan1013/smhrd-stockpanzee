// /frontend/src/pages/assetDetail.tsx
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

const AssetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // id가 없으면 잘못된 접근 처리
  if (!id) {
    return <div className="text-white p-8">잘못된 접근입니다</div>;
  }

  const [asset, setAsset] = useState<Asset | null>(null);

  // 단일 자산 조회
  useEffect(() => {
    fetchAssetById(Number(id))
      .then((a) => setAsset(a))
      .catch((err) => console.error("Asset fetch error:", err));
  }, [id]);

  // TradingView 차트 렌더링
  useEffect(() => {
    if (!asset) return;
    const tvSymbol = getTradingViewSymbol(asset.symbol, asset.market);
    const containerId = `tv-chart-${asset.id}`;
    renderTradingViewChart(containerId, tvSymbol);
  }, [asset]);

  // 로딩 상태
  if (!asset) {
    return <div className="text-white p-8">로딩 중…</div>;
  }

  const containerId = `tv-chart-${asset.id}`;

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
