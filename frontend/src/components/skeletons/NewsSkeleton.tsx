// /frontend/src/components/skeletons/NewsSkeleton.tsx
import React from "react";
import SkeletonCard from "../skeletons/SkeletonCard";

interface NewsSkeletonProps {
  itemsPerPage?: number;
}

const NewsSkeleton: React.FC<NewsSkeletonProps> = ({ itemsPerPage = 3 }) => (
  <section className="container mx-auto px-4 py-8">
    {/* NAV + SEARCH skeleton */}
    <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
      <div className="flex items-center">
        {/* 즐겨찾기 & tabs */}
        <div className="flex space-x-6 border-b border-gray-700 pb-2">
          <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-700 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
      <div className="w-full md:w-64">
        <div className="h-10 bg-gray-700 rounded-full animate-pulse" />
      </div>
    </div>

    {/* News Cards Skeleton */}
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: itemsPerPage }).map((_, i) => (
        <li key={i}>
          <SkeletonCard />
        </li>
      ))}
    </ul>

    {/* loader */}
    <div className="mt-8 flex justify-center">
      <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
    </div>
  </section>
);

export default NewsSkeleton;
