// /frontend/src/components/skeletons/CommunitySkeleton.tsx
import React from "react";
import SkeletonCard from "./SkeletonCard";

const CommunitySkeleton: React.FC = () => (
  <section className="container mx-auto px-4 py-8">
    {/* 상단 컨트롤 스켈레톤 */}
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
      {/* 정렬 버튼 스켈레톤 (2개) */}
      <div className="flex items-center space-x-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-gray-700 rounded-md animate-pulse" />
        ))}
      </div>

      {/* 카테고리 버튼 스켈레톤 (4개) */}
      <div className="flex items-center space-x-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-700 rounded-full animate-pulse" />
        ))}
      </div>

      {/* 글쓰기 버튼 스켈레톤 */}
      <div className="h-8 w-24 bg-gray-700 rounded-full animate-pulse" />
    </div>

    {/* 게시글 그리드 스켈레톤 */}
    <div
      id="posts-top"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
    >
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
