// /frontend/src/components/CommunityCard.tsx
import React from "react";
import { Link } from "react-router-dom";
import Icons from "./Icons";

export interface CommunityPost {
  id: number;
  category: string;
  community_title: string;
  community_contents: string;
  community_likes: number;
  community_views: number;
  created_at: string;
  nickname?: string;
  name?: string;
  comment_count?: number;
  img_url?: string;
}

interface CommunityCardProps {
  post: CommunityPost;
  commentCount?: number;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  date.setHours(date.getHours() - 9);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ post, commentCount = 0 }) => {
  const imgSrc = post.img_url
    ? post.img_url.startsWith("/uploads/")
      ? `${import.meta.env.VITE_API_BASE_URL}${post.img_url}`
      : post.img_url
    : "/panzee.webp";

  return (
    <Link
      to={`/communitydetail/${post.id}`}
      className="
        transform-gpu
        flex flex-col h-full bg-gray-800 rounded-lg shadow-lg overflow-hidden
        hover:scale-[1.02] transition-transform duration-200
      "
    >
      <img src={imgSrc} alt="썸네일" className="w-full aspect-video object-cover" />
      <div className="flex-1 flex flex-col p-4">
        <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{post.community_title}</h3>
        <p className="text-gray-300 text-sm flex-1 line-clamp-3 whitespace-pre-wrap">
          {post.community_contents}
        </p>
        <div className="mt-4 text-xs text-gray-400 flex justify-between">
          <span>{timeAgo(post.created_at)}</span>
          <div className="flex space-x-3">
            <span className="flex items-center">
              <Icons name="thumbsUp" className="w-4 h-4 mr-1" />
              {post.community_likes}
            </span>
            <span className="flex items-center">
              <Icons name="messageDots" className="w-4 h-4 mr-1" />
              {commentCount}
            </span>
            <span className="flex items-center">
              <Icons name="eyeOpen" className="w-4 h-4 mr-1" />
              {post.community_views}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default React.memo(CommunityCard);
