// /frontend/src/components/skeletons/CommunityDetailSkeleton.tsx
import React from "react";

const CommunityDetailSkeleton: React.FC = () => (
  <div className="mx-auto px-4 py-8 max-w-4xl space-y-6 animate-pulse">
    {/* 상단 메타 + 제목 스켈레톤 */}
    <div className="space-y-2">
      <div className="h-6 bg-gray-700 rounded w-1/4" />
      <div className="h-8 bg-gray-700 rounded w-3/4" />
    </div>

    {/* 이미지 스켈레톤 */}
    <div className="w-full aspect-video bg-gray-800 rounded" />

    {/* 본문 텍스트 스켈레톤 */}
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-4 bg-gray-700 rounded w-full" />
      ))}
    </div>

    {/* 좋아요/댓글/조회수 바 */}
    <div className="flex items-center space-x-6">
      <div className="h-6 bg-gray-700 rounded w-16" />
      <div className="flex space-x-4">
        <div className="h-6 w-16 bg-gray-700 rounded" />
        <div className="h-6 w-16 bg-gray-700 rounded" />
        <div className="h-6 w-16 bg-gray-700 rounded" />
      </div>
    </div>

    <hr className="border-gray-700 opacity-50" />

    {/* 댓글 스켈레톤 */}
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-6 bg-gray-700 rounded w-1/3" />
          <div className="h-4 bg-gray-700 rounded w-full" />
        </div>
      ))}
    </div>
  </div>
);

export default CommunityDetailSkeleton;
