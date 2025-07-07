// /frontend/src/components/skeletons/CommunitySkeleton.tsx
import React from "react";
import SkeletonCard from "./SkeletonCard";

const CommunitySkeleton: React.FC = () => (
  <section className="container mx-auto px-4 py-8">
    {/* ─── 상단: 정렬·카테고리 + 검색 ─── */}
    <nav className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 space-y-4 md:space-y-0">
      {/* 정렬 & 카테고리 탭 스켈레톤 */}
      <ul className="flex flex-wrap space-x-6 border-b border-gray-700 pb-2">
        {/* 정렬 옵션(2개) */}
        {Array.from({ length: 2 }).map((_, i) => (
          <li key={`sort-${i}`}>
            <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse" />
          </li>
        ))}
        {/* 카테고리 옵션(4개) */}
        {Array.from({ length: 4 }).map((_, i) => (
          <li key={`cat-${i}`}>
            <div className="h-8 w-20 bg-gray-700 rounded-full animate-pulse" />
          </li>
        ))}
      </ul>

      {/* 검색창 스켈레톤 */}
      <div className="w-full md:w-64">
        <div className="h-10 bg-gray-700 rounded-full animate-pulse" />
      </div>
    </nav>

    {/* 글쓰기 버튼 스켈레톤 */}
    <div className="flex justify-end mb-6">
      <div className="h-10 w-24 bg-gray-700 rounded-full animate-pulse" />
    </div>

    {/* 게시글 그리드 스켈레톤 */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>

    {/* 페이지네이션 스켈레톤 */}
    <div className="flex justify-center items-center mt-8 space-x-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-8 w-8 bg-gray-700 rounded-md animate-pulse" />
      ))}
    </div>
  </section>
);

export default CommunitySkeleton;
