// /frontend/src/components/skeletons/MarketSkeleton.tsx
import React from "react";
import SkeletonCard from "./SkeletonCard";

const MarketSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-900">
    {/* 헤더 스켈레톤 */}
    <header className="py-4 text-center">
      <div className="h-8 bg-gray-700 rounded w-1/3 mx-auto animate-pulse" />
    </header>

    <section className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* 탭 & 토글 스켈레톤 */}
      <div className="flex mb-4">
        <div className="inline-flex bg-gray-800 p-2 rounded-full space-x-2 animate-pulse">
          <div className="h-8 w-8 bg-gray-700 rounded-full" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-700 rounded-full" />
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* 리스트 영역 스켈레톤 */}
        <div className="w-full md:w-2/3 space-y-2">
          {/* 테이블 헤더 스켈레톤 */}
          <div className="flex items-center px-4 py-2 bg-gray-800 rounded-lg animate-pulse">
            <div className="flex-1 h-4 bg-gray-700 rounded" />
            <div className="w-28 h-4 bg-gray-700 rounded ml-4" />
            <div className="w-20 h-4 bg-gray-700 rounded ml-4" />
            <div className="w-36 h-4 bg-gray-700 rounded ml-4" />
          </div>
          {/* 데이터 행 스켈레톤 */}
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* 사이드바 스켈레톤 */}
        <div className="w-full md:w-1/3">
          <div className="sticky top-20 space-y-4">
            {/* 검색바 스켈레톤 */}
            <div className="relative animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-full" />
            </div>
            {/* 요약 카드 스켈레톤 */}
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-6 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-1/2 mx-auto" />
              <div className="h-4 bg-gray-700 rounded w-full" />
              <div className="grid grid-cols-3 gap-3">
                <div className="h-12 bg-gray-700 rounded" />
                <div className="h-12 bg-gray-700 rounded" />
                <div className="h-12 bg-gray-700 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4" />
                    <div className="h-6 bg-gray-700 rounded w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default MarketSkeleton;
