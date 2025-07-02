// /frontend/src/components/SkeletonCard.tsx
import React from "react";

const SkeletonCard: React.FC = () => (
  <div className="animate-pulse bg-gray-800 rounded-lg overflow-hidden">
    <div className="h-48 bg-gray-700" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-700 rounded w-full" />
      <div className="h-4 bg-gray-700 rounded w-5/6" />
    </div>
  </div>
);

export default SkeletonCard;
