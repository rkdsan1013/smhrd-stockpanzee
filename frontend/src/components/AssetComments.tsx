// /frontend/src/componets/AssetComments.tsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import Comments from "./Comments";
import type { Comment } from "./Comments";
import axios from "axios";

const PAGE_SIZE = 10;

const AssetComments: React.FC<{ assetId: number }> = ({ assetId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const loader = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    const offset = reset ? 0 : page * PAGE_SIZE;
    const res = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/community/${assetId}/comments?offset=${offset}&limit=${PAGE_SIZE}`,
      { withCredentials: true }
    );
    let data = res.data as Comment[];
    // 최신 댓글이 맨 위로 (createdAt 기준)
    data = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setComments((prev) => reset ? data : [...prev, ...data]);
    setHasMore(data.length === PAGE_SIZE);
    setLoading(false);
    if (reset) setPage(1);
    else setPage((p) => p + 1);
  }, [assetId, page, loading]);

  // 최초 로딩, assetId 바뀔 때
  useEffect(() => {
    setComments([]);
    setPage(0);
    setHasMore(true);
    fetchComments(true);
    // eslint-disable-next-line
  }, [assetId]);

  // 무한스크롤(IntersectionObserver)
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchComments();
      },
      { threshold: 1 }
    );
    if (loader.current) observer.observe(loader.current);
    return () => observer.disconnect();
  }, [fetchComments, hasMore, loading]);

  return (
    <div>
      <Comments comments={comments} fetchComments={() => fetchComments(true)} postId={assetId.toString()} />
      <div ref={loader}></div>
      {loading && <div className="text-gray-400 text-sm text-center mt-2">로딩 중...</div>}
      {/* "댓글 끝" 메시지 제거 */}
    </div>
  );
};

export default AssetComments;

