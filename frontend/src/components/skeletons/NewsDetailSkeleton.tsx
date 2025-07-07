// /frontend/src/components/skeletons/NewsDetailSkeleton.tsx
import React from "react";
import SkeletonCard from "./SkeletonCard";

interface NewsDetailSkeletonProps {
  latestCount?: number;
}

const NewsDetailSkeleton: React.FC<NewsDetailSkeletonProps> = ({ latestCount = 5 }) => (
  <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 space-y-8 animate-pulse">
    <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Main Column */}
      <div className="md:col-span-2 space-y-6">
        {/* Header */}
        <div className="bg-gray-800 rounded-2xl p-6">
          <div className="h-8 bg-gray-700 rounded w-3/5 mb-4" />
          <div className="flex flex-wrap gap-2 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-5 bg-gray-700 rounded w-20" />
            ))}
          </div>
          <div className="h-48 bg-gray-700 rounded-2xl" />
        </div>

        {/* AI 요약 & 평가 */}
        <div className="bg-gray-800 rounded-2xl p-6 space-y-4">
          <div className="h-5 bg-gray-700 rounded w-1/4" />
          <div className="flex space-x-4">
            <div className="flex-1 h-2 bg-gray-700 rounded" />
            <div className="flex-1 h-2 bg-gray-700 rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-700 rounded w-5/6" />
          </div>
        </div>

        {/* 긍정·부정 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-2xl p-6 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-1/3" />
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-3 bg-gray-700 rounded w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6">
        {/* 차트 */}
        <div className="h-56 bg-gray-800 rounded-2xl" />

        {/* 최신 뉴스 스켈레톤 카드 (한 번만) */}
        <div className="space-y-4">
          <div className="h-5 bg-gray-700 rounded w-1/2" />
          {[...Array(latestCount)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </aside>
    </div>
  </div>
);

export default NewsDetailSkeleton;
