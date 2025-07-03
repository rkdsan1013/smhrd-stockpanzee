// /frontend/src/pages/Community.tsx
import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Icons from "../components/Icons";
import CommunitySkeleton from "../components/skeletons/CommunitySkeleton";
import CommunityCard from "../components/CommunityCard";
import type { CommunityPost } from "../components/CommunityCard";
import { AuthContext } from "../providers/AuthProvider";

const SORT_OPTIONS = ["latest", "popular"] as const;
type SortKey = (typeof SORT_OPTIONS)[number];
const CATEGORY_LIST = ["전체", "국내", "해외", "암호화폐"];
const POSTS_PER_PAGE = 12;
const RECENT_DAYS = 3;

function getDisplayPages(total: number, current: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

const Community: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("popular");
  const [filterCat, setFilterCat] = useState<string>("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // 글쓰기 버튼 핸들러
  const handleWrite = () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    navigate("/post");
  };

  // 게시글 로드
  useEffect(() => {
    setLoading(true);
    axios
      .get<CommunityPost[]>(`${import.meta.env.VITE_API_BASE_URL}/community`)
      .then((res) => setPosts(res.data || []))
      .catch((err) => {
        console.error(err);
        alert("게시글 불러오기 실패");
      })
      .finally(() => setLoading(false));
  }, []);

  // 댓글 수 동기화
  useEffect(() => {
    if (!posts.length) return;

    // 필터・정렬 로직
    const processed = (() => {
      let arr = posts.slice();
      if (filterCat !== "전체") {
        arr = arr.filter((p) => p.category === filterCat);
      }
      if (sortKey === "latest") {
        arr.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
      } else {
        const cutoff = Date.now() - RECENT_DAYS * 24 * 3600 * 1000;
        const recent = arr
          .filter((p) => new Date(p.created_at).getTime() >= cutoff)
          .sort((a, b) => b.community_views - a.community_views);
        const older = arr
          .filter((p) => new Date(p.created_at).getTime() < cutoff)
          .sort((a, b) => b.community_views - a.community_views);
        arr = [...recent, ...older];
      }
      return arr;
    })();

    // 현재 페이지에 보이는 게시글
    const visible = processed.slice(
      (currentPage - 1) * POSTS_PER_PAGE,
      currentPage * POSTS_PER_PAGE,
    );

    // 댓글 수가 없는 게시글 ID 추출
    const idsToFetch = visible.map((p) => p.id).filter((id) => !(id in commentCounts));
    if (!idsToFetch.length) return;

    Promise.all(
      idsToFetch.map((id) =>
        axios
          .get<{ count: number }>(
            `${import.meta.env.VITE_API_BASE_URL}/community/${id}/commentcount`,
          )
          .then((res) => [id, res.data.count || 0] as [number, number])
          .catch(() => [id, 0] as [number, number]),
      ),
    ).then((results) => {
      setCommentCounts((prev) => {
        const updated = { ...prev };
        results.forEach(([id, cnt]) => {
          updated[id] = cnt;
        });
        return updated;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, filterCat, sortKey, currentPage]);

  // 맨 위로 버튼 토글
  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // 정렬・필터링된 전체 목록
  const processed = useMemo(() => {
    let arr = posts.slice();
    if (filterCat !== "전체") {
      arr = arr.filter((p) => p.category === filterCat);
    }
    if (sortKey === "latest") {
      arr.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    } else {
      const cutoff = Date.now() - RECENT_DAYS * 24 * 3600 * 1000;
      const recent = arr
        .filter((p) => new Date(p.created_at).getTime() >= cutoff)
        .sort((a, b) => b.community_views - a.community_views);
      const older = arr
        .filter((p) => new Date(p.created_at).getTime() < cutoff)
        .sort((a, b) => b.community_views - a.community_views);
      arr = [...recent, ...older];
    }
    return arr;
  }, [posts, sortKey, filterCat]);

  const totalPages = Math.ceil(processed.length / POSTS_PER_PAGE) || 1;
  const displayPages = getDisplayPages(totalPages, currentPage);
  const visiblePosts = useMemo(
    () => processed.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE),
    [processed, currentPage],
  );

  // 페이지 이동 시 스크롤
  useEffect(() => {
    if (currentPage > 1) {
      const topY =
        document.getElementById("posts-top")!.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: topY, behavior: "smooth" });
    }
  }, [currentPage]);

  // 로딩 중에는 스켈레톤 렌더링
  if (loading) {
    return <CommunitySkeleton />;
  }

  return (
    <section className="container mx-auto px-4 py-8">
      {/* 상단 컨트롤 */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div className="flex items-center space-x-2">
          {SORT_OPTIONS.map((key) => (
            <button
              key={key}
              onClick={() => {
                setSortKey(key);
                setCurrentPage(1);
              }}
              className={`px-3 py-2 rounded-md transition ${
                sortKey === key
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
              }`}
            >
              {key === "latest" ? "최신순" : "인기순"}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {CATEGORY_LIST.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setFilterCat(cat);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filterCat === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={handleWrite}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow hover:from-blue-600 hover:to-blue-700 transition"
        >
          글쓰기
        </button>
      </div>

      {/* 게시글 그리드 */}
      <div
        id="posts-top"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
      >
        {!visiblePosts.length ? (
          <div className="col-span-full text-center text-gray-400 py-12">게시글이 없습니다.</div>
        ) : (
          visiblePosts.map((post) => (
            <CommunityCard key={post.id} post={post} commentCount={commentCounts[post.id] || 0} />
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {visiblePosts.length > 0 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <button
            onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-md transition ${
              currentPage === 1
                ? "text-gray-500 cursor-not-allowed"
                : "text-white hover:text-gray-300"
            }`}
          >
            <Icons name="angleLeft" className="w-5 h-5" />
          </button>

          {displayPages.map((p, i) =>
            p === "..." ? (
              <span key={i} className="px-2 text-gray-500">
                …
              </span>
            ) : (
              <button
                key={i}
                onClick={() => setCurrentPage(p as number)}
                className={`px-3 py-1 rounded-md transition ${
                  p === currentPage ? "bg-blue-600 text-white" : "text-white hover:bg-gray-700"
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md transition ${
              currentPage === totalPages
                ? "text-gray-500 cursor-not-allowed"
                : "text-white hover:text-gray-300"
            }`}
          >
            <Icons name="angleRight" className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 맨 위로 버튼 */}
      {showTopBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 text-4xl text-blue-500 hover:text-blue-400 transition"
          aria-label="Scroll to top"
        >
          <Icons name="arrowUpCircle" />
        </button>
      )}
    </section>
  );
};

export default Community;
