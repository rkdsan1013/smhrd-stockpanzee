// /frontend/src/components/skeletons/NewsDetailSkeleton.tsx
import React from "react";
import SkeletonCard from "./SkeletonCard";

interface NewsDetailSkeletonProps {
  latestCount?: number;
}

const NewsDetailSkeleton: React.FC<NewsDetailSkeletonProps> = ({ latestCount = 5 }) => (
  <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 space-y-8 animate-pulse">
    {/* 헤더 */}
    <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <div className="h-8 bg-gray-700 rounded w-3/4" />
        <div className="h-6 bg-gray-700 rounded w-1/2" />
        <div className="h-40 bg-gray-800 rounded-2xl border border-gray-700" />
      </div>
      <aside className="space-y-4">
        <div className="h-6 bg-gray-700 rounded w-1/2" />
        {Array.from({ length: latestCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </aside>
    </div>

    {/* 감정·태그 영역 */}
    <div className="max-w-screen-xl mx-auto bg-gray-800 rounded-2xl p-6 shadow-lg space-y-4">
      <div className="h-4 bg-gray-700 rounded w-1/4" />
      <div className="flex space-x-4">
        <div className="h-10 w-32 bg-gray-700 rounded" />
        <div className="h-10 w-32 bg-gray-700 rounded" />
        <div className="flex-1 h-10 bg-gray-700 rounded" />
      </div>
      <div className="h-3 bg-gray-700 rounded w-full" />
      <div className="h-3 bg-gray-700 rounded w-full" />
    </div>

    {/* 요약 */}
    <div className="max-w-screen-xl mx-auto bg-gray-800 rounded-2xl p-6 shadow-lg">
      <div className="h-6 bg-gray-700 rounded w-1/3 mb-4" />
      <div className="h-4 bg-gray-700 rounded w-full" />
      <div className="h-4 bg-gray-700 rounded w-full mt-2" />
      <div className="h-4 bg-gray-700 rounded w-5/6 mt-2" />
    </div>

    {/* 긍정·부정 리스트 */}
    <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-gray-800 rounded-2xl p-6 shadow-lg space-y-2">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2" />
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="h-3 bg-gray-700 rounded w-full" />
          ))}
        </div>
      ))}
    </div>

    {/* 차트 + 관련 뉴스 */}
    <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <div className="h-40 bg-gray-800 rounded-2xl border border-gray-700" />
        <div className="h-6 bg-gray-700 rounded w-1/3" />
        {Array.from({ length: latestCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <aside className="space-y-4">
        <div className="h-6 bg-gray-700 rounded w-2/3" />
        {Array.from({ length: latestCount }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </aside>
    </div>

    {/* Prev/Next 버튼 */}
    <div className="max-w-screen-xl mx-auto py-6 flex justify-between">
      <div className="h-8 w-32 bg-gray-700 rounded" />
      <div className="h-8 w-32 bg-gray-700 rounded" />
    </div>
  </div>
);

export default NewsDetailSkeleton;
