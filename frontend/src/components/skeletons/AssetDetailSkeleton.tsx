// /frontend/src/components/skeletons/AssetDetailSkeleton.tsx
import React from "react";
import SkeletonCard from "./SkeletonCard";

const AssetDetailSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 space-y-8 animate-pulse">
    {/* 헤더 스켈레톤 */}
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-gray-700 rounded-full" />
        <div className="h-8 bg-gray-700 rounded w-48" />
      </div>
      <div className="flex space-x-6 border-b border-gray-700 pt-2">
        <div className="w-20 h-6 bg-gray-700 rounded" />
        <div className="w-20 h-6 bg-gray-700 rounded" />
      </div>
    </header>

    {/* 본문 스켈레톤 */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {/* 차트와 주요 뉴스 */}
      <div className="md:col-span-2 flex flex-col space-y-6">
        <div className="w-full h-80 md:h-[500px] bg-gray-800 rounded-2xl border border-gray-700" />
        <div className="h-6 bg-gray-700 rounded w-1/2" />
        <SkeletonCard />
      </div>

      {/* 관련 뉴스 리스트 */}
      <aside className="flex flex-col gap-4">
        <div className="h-6 bg-gray-700 rounded w-1/2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </aside>
    </div>
  </div>
);

export default AssetDetailSkeleton;
