// /frontend/src/components/skeleton'HomeSkeleton.tsx
import React from "react";
import SkeletonCard from "../skeletons/SkeletonCard";

const HomeSkeleton: React.FC = () => (
  <div className="bg-gray-900 min-h-screen py-8 px-4">
    <div className="max-w-screen-xl mx-auto space-y-8">
      {/* 카테고리 & 즐겨찾기 탭 스켈레톤 */}
      <nav className="overflow-x-auto flex justify-start mb-8">
        <ul className="flex space-x-6 border-b border-gray-700">
          <li>
            <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse" />
          </li>
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <div className="h-8 w-20 bg-gray-700 rounded-full animate-pulse" />
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* 좌측: 인기 뉴스 & 리스트 스켈레톤 */}
        <div className="lg:col-span-2 flex flex-col space-y-8">
          <SkeletonCard /> {/* Hero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard /> {/* CommunityPopularWidget */}
        </div>

        {/* 우측: 분석 사이드바 스켈레톤 */}
        <aside className="space-y-6">
          {/* 기간 선택 스켈레톤 */}
          <nav className="overflow-x-auto pb-2">
            <ul className="flex space-x-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i}>
                  <div className="h-6 w-14 bg-gray-700 rounded-full animate-pulse" />
                </li>
              ))}
            </ul>
          </nav>
          {/* 감정 분석 스켈레톤 */}
          <div className="bg-gray-800 p-6 rounded-lg shadow space-y-4">
            <div className="h-6 w-3/5 bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-700 rounded-full animate-pulse" />
            <div className="h-4 w-full bg-gray-700 rounded-full animate-pulse" />
            <div className="h-5 w-1/2 bg-gray-700 rounded animate-pulse" />
          </div>
          {/* 키워드 트렌드 스켈레톤 */}
          <div className="bg-gray-800 p-6 rounded-lg shadow space-y-4">
            <div className="h-6 w-3/5 bg-gray-700 rounded animate-pulse" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-2/3 bg-gray-700 rounded animate-pulse" />
                <div className="h-2 w-full bg-gray-700 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
          <SkeletonCard /> {/* FavoriteAssetsWidget */}
        </aside>
      </div>
    </div>
  </div>
);

export default HomeSkeleton;
