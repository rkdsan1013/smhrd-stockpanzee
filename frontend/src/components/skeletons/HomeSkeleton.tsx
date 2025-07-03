// /frontend/src/components/HomeSkeleton.tsx
import React from "react";
import SkeletonCard from "../skeletons/SkeletonCard";

const HomeSkeleton: React.FC = () => (
  <div className="bg-gray-900 min-h-screen py-8 px-4">
    <div className="max-w-screen-xl mx-auto space-y-12">
      {/* 탭 스켈레톤 */}
      <nav className="overflow-x-auto pb-2">
        <ul className="flex space-x-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <div className="h-8 w-20 bg-gray-700 rounded-full animate-pulse" />
            </li>
          ))}
        </ul>
      </nav>

      {/* 메인 그리드 스켈레톤 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 flex flex-col space-y-8">
          <SkeletonCard />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="h-40 bg-gray-800 rounded-lg animate-pulse" />
        </div>

        <aside className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </aside>
      </div>
    </div>
  </div>
);

export default HomeSkeleton;
