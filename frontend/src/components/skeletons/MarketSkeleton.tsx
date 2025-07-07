// /frontend/src/components/skeletons/MarketSkeleton.tsx
import React from "react";
import SkeletonCard from "./SkeletonCard";

const MarketSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-900">
    <section className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
      {/* Nav tabs skeleton */}
      <nav className="overflow-x-auto flex justify-start border-b border-gray-700 mb-4">
        <ul className="flex space-x-6 px-1">
          {/* Favorite toggle */}
          <li>
            <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse" />
          </li>
          {/* Category tabs */}
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <div className="h-8 w-20 bg-gray-700 rounded-full animate-pulse" />
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left: list area skeleton using SkeletonCard */}
        <div className="w-full md:w-2/3 grid grid-cols-1 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>

        {/* Right: sidebar skeleton */}
        <div className="w-full md:w-1/3 space-y-6">
          {/* Search bar skeleton */}
          <div className="h-10 bg-gray-800 rounded-full animate-pulse" />

          {/* Summary card skeleton */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-700 rounded w-full" />
            <div className="h-4 bg-gray-700 rounded w-full" />
          </div>

          {/* Top gainers skeleton */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/2" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-700 rounded w-2/3" />
                <div className="h-4 bg-gray-700 rounded w-1/4" />
              </div>
            ))}
          </div>

          {/* Top losers skeleton */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 space-y-4 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-1/2" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-700 rounded w-2/3" />
                <div className="h-4 bg-gray-700 rounded w-1/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  </div>
);

export default MarketSkeleton;
