// /frontend/src/components/CommunityPopularWidget.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icons from "./Icons";
import axios from "axios";

interface CommunityPost {
  id: number;
  category: string;
  community_title: string;
  community_contents: string;
  community_likes: number;
  community_views: number;
  created_at: string;
  comment_count?: number; // 원래는 주지만, 없으면 아래에서 직접 fetch
  img_url?: string;
}

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
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axios
      .get<CommunityPost[]>(`${import.meta.env.VITE_API_BASE_URL}/community`)
      .then((res) => setPosts(res.data || []))
      .catch(() => setErr("커뮤니티 데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  // 인기글 상위 3개만 골라내서, id별로 댓글 수 fetch
  useEffect(() => {
    if (!posts.length) return;
    const cat = tabToCategory(selectedTab);
    let filtered = posts.slice();
    if (cat !== "전체") filtered = filtered.filter((p) => p.category === cat);
    filtered = filtered.sort((a, b) => b.community_views - a.community_views).slice(0, 3);

    // 각 게시글에 대해 댓글 수 요청
    Promise.all(
      filtered.map((post) =>
        axios
          .get(`${import.meta.env.VITE_API_BASE_URL}/community/${post.id}/commentcount`)
          .then((res) => [post.id, res.data.count || 0] as [number, number])
          .catch(() => [post.id, 0] as [number, number])
      )
    ).then((results) => {
      const obj: Record<number, number> = {};
      results.forEach(([id, count]) => (obj[id] = count));
      setCommentCounts(obj);
    });
  }, [posts, selectedTab]);

  const cat = tabToCategory(selectedTab);
  let filtered = posts.slice();
  if (cat !== "전체") filtered = filtered.filter((p) => p.category === cat);
  filtered = filtered.sort((a, b) => b.community_views - a.community_views).slice(0, 3);

  if (loading)
    return (
      <div className="bg-gray-800 rounded-xl p-6 my-3 flex justify-center text-gray-400 h-36 items-center">
        인기글 불러오는 중…
      </div>
    );
  if (err)
    return (
      <div className="bg-gray-800 rounded-xl p-6 my-3 flex justify-center text-red-400 h-36 items-center">
        {err}
      </div>
    );

  return (
    <section className="mb-10">
      <div className="flex items-center mb-4 px-1">
        <h3 className="text-lg font-bold text-white flex-1">커뮤니티 인기글</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 text-gray-400 flex items-center h-28">
            인기글이 없습니다.
          </div>
        ) : (
          filtered.map((post) => (
            <div
              key={post.id}
              className="flex flex-col bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:scale-[1.015] hover:shadow-2xl transition cursor-pointer"
              onClick={() => navigate(`/communitydetail/${post.id}`)}
            >
              <img
                src={
                  post.img_url
                    ? post.img_url.startsWith("/uploads/")
                      ? `${import.meta.env.VITE_API_BASE_URL}${post.img_url}`
                      : post.img_url
                    : "/panzee.webp"
                }
                alt="썸네일"
                className="w-full h-28 object-cover bg-gray-900"
              />
              <div className="flex flex-col flex-1 p-3">
                <h4 className="text-base font-bold text-white mb-1 line-clamp-2">
                  {post.community_title}
                </h4>
                <p className="text-gray-400 text-xs line-clamp-2 mb-2 flex-1">
                  {post.community_contents}
                </p>
                <div className="flex text-xs text-gray-400 gap-3 mt-auto">
                  <span className="flex items-center">
                    <Icons name="eye" className="w-4 h-4 mr-1" />
                    {post.community_views}
                  </span>
                  <span className="flex items-center">
                    <Icons name="thumbsUp" className="w-4 h-4 mr-1" />
                    {post.community_likes}
                  </span>
                  <span className="flex items-center">
                    <Icons name="messageDots" className="w-4 h-4 mr-1" />
                    {/* 직접 가져온 댓글 수가 있으면 그걸 표시 */}
                    {typeof commentCounts[post.id] === "number"
                      ? commentCounts[post.id]
                      : post.comment_count ?? 0}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default CommunityPopularWidget;
