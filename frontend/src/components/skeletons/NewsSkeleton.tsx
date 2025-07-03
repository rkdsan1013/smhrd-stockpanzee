// /frontend/src/components/skeletons/NewsSkeleton.tsx
import React from "react";
import SkeletonCard from "./SkeletonCard";

interface NewsSkeletonProps {
  itemsPerPage?: number;
}

const NewsSkeleton: React.FC<NewsSkeletonProps> = ({ itemsPerPage = 3 }) => (
  <section className="container mx-auto px-4 py-8">
    {/* Header + Tabs Skeleton */}
    <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
      {/* Title Skeleton */}
      <div className="h-8 bg-gray-700 rounded w-1/3 animate-pulse mb-4 sm:mb-0" />
      {/* Tabs Skeleton */}
      <div className="flex space-x-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 w-16 bg-gray-700 rounded-full animate-pulse" />
        ))}
      </div>
    </div>

    {/* News Cards Skeleton */}
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      {Array.from({ length: itemsPerPage }).map((_, i) => (
        <li key={i}>
          <SkeletonCard />
        </li>
      ))}
    </ul>

    {/* Infinite Scroll Loader Skeleton */}
    <div className="mt-8 h-4 bg-gray-700 rounded w-32 mx-auto animate-pulse" />
  </section>
);

export default NewsSkeleton;
