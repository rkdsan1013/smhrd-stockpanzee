// /frontend/src/components/AssetComments.tsx
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

  // ✅ 중복 방지 및 새로고침/댓글 등록시 완전 덮어쓰기
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

    if (reset) {
      setComments(data);     // 💡 새로고침/처음 로딩/댓글 등록 시 덮어쓰기
      setPage(1);
    } else {
      setComments(prev => {
        // id 기준으로 중복 방지 추가
        const prevIds = new Set(prev.map(c => c.id));
        const filtered = data.filter(c => !prevIds.has(c.id));
        return [...prev, ...filtered];
      });
      setPage(p => p + 1);
    }

    setHasMore(data.length === PAGE_SIZE);
    setLoading(false);
  }, [assetId, page, loading]);

  // 최초 로딩, assetId 바뀔 때
  useEffect(() => {
    setComments([]);
    setPage(0);
    setHasMore(true);
    fetchComments(true); // reset = true: 덮어쓰기!
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
      {/* 새로고침, 댓글 작성, 삭제, 수정 등은 fetchComments(true)로 덮어쓰기! */}
      <Comments comments={comments} fetchComments={() => fetchComments(true)} postId={assetId.toString()} />
      <div ref={loader}></div>
      {loading && <div className="text-gray-400 text-sm text-center mt-2">로딩 중...</div>}
    </div>
  );
};

export default AssetComments;
