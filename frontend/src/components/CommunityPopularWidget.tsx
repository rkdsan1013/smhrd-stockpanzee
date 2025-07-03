// /frontend/src/components/CommunityPopularWidget.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import CommunityCard from "./CommunityCard";
import type { CommunityPost } from "./CommunityCard";

type CommunityTabKey = "all" | "domestic" | "international" | "crypto";
const tabToCategory = (tab: CommunityTabKey) => {
  if (tab === "domestic") return "국내";
  if (tab === "international") return "해외";
  if (tab === "crypto") return "암호화폐";
  return "전체";
};

interface Props {
  selectedTab: CommunityTabKey;
}

const CommunityPopularWidget: React.FC<Props> = ({ selectedTab }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // 전체 커뮤니티 포스트 로드
  useEffect(() => {
    setLoading(true);
    axios
      .get<CommunityPost[]>(`${import.meta.env.VITE_API_BASE_URL}/community`)
      .then((res) => setPosts(res.data || []))
      .catch(() => setErr("커뮤니티 데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // 인기 글 상위 3개에 대해 댓글 수 fetch
  useEffect(() => {
    if (!posts.length) return;

    const category = tabToCategory(selectedTab);
    let filtered = posts.slice();
    if (category !== "전체") {
      filtered = filtered.filter((p) => p.category === category);
    }
    filtered = filtered.sort((a, b) => b.community_views - a.community_views).slice(0, 3);

    Promise.all(
      filtered.map((post) =>
        axios
          .get<{ count: number }>(
            `${import.meta.env.VITE_API_BASE_URL}/community/${post.id}/commentcount`,
          )
          .then((res) => [post.id, res.data.count || 0] as [number, number])
          .catch(() => [post.id, 0] as [number, number]),
      ),
    ).then((results) => {
      const map: Record<number, number> = {};
      results.forEach(([id, count]) => {
        map[id] = count;
      });
      setCommentCounts(map);
    });
  }, [posts, selectedTab]);

  // 상위 3개 필터링
  const category = tabToCategory(selectedTab);
  let filtered = posts.slice();
  if (category !== "전체") {
    filtered = filtered.filter((p) => p.category === category);
  }
  filtered = filtered.sort((a, b) => b.community_views - a.community_views).slice(0, 3);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 my-3 flex justify-center text-gray-400 h-36 items-center">
        인기글 불러오는 중…
      </div>
    );
  }

  if (err) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 my-3 flex justify-center text-red-400 h-36 items-center">
        {err}
      </div>
    );
  }

  return (
    <section className="mb-10">
      <div className="flex items-center mb-4 px-1">
        <h3 className="text-lg font-bold text-white flex-1">커뮤니티 인기글</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 text-gray-400 flex items-center h-28">인기글이 없습니다.</div>
        ) : (
          filtered.map((post) => (
            <CommunityCard
              key={post.id}
              post={post}
              commentCount={
                typeof commentCounts[post.id] === "number"
                  ? commentCounts[post.id]
                  : (post.comment_count ?? 0)
              }
            />
          ))
        )}
      </div>
    </section>
  );
};

export default CommunityPopularWidget;
