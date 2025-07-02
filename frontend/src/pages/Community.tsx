// /frontend/src/pages/Community.tsx
// cSpell:ignore communitydetail panzee
import React, { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Icons from "../components/Icons";
import SkeletonCard from "../components/SkeletonCard";
import { AuthContext } from "../providers/AuthProvider";

// 게시글 타입
interface CommunityPost {
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

// 정렬 옵션 및 카테고리
const SORT_OPTIONS = ["latest", "popular"] as const;
type SortKey = (typeof SORT_OPTIONS)[number];
const CATEGORY_LIST = ["전체", "국내", "해외", "암호화폐"];

// 페이지네이션 상수
const POSTS_PER_PAGE = 12;
// 최근 기준 (7일)
const RECENT_DAYS = 3;

// “몇 초/분 전” 표시 헬퍼
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  date.setHours(date.getHours() - 9);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

// 페이지네이션 페이지 목록 생성
function getDisplayPages(total: number, current: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
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
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("latest");
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
      .then((res) => {
        const data = res.data.map((p) => ({
          ...p,
          comment_count: p.comment_count ?? 0,
        }));
        setPosts(data);
      })
      .catch((err) => {
        console.error(err);
        alert("게시글 불러오기 실패");
      })
      .finally(() => setLoading(false));
  }, []);

  // 스크롤 토글 (맨 위로 버튼)
  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 정렬 + 필터 적용 (popular: 최근 7일 우선)
  const processed = useMemo(() => {
    let arr = posts.slice();
    // 필터
    if (filterCat !== "전체") {
      arr = arr.filter((p) => p.category === filterCat);
    }
    if (sortKey === "latest") {
      // 최신순
      arr.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    } else {
      // 인기순: 최근 7일 글 먼저, 조회수 순으로, 그 다음 오래된 글 조회수 순
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

  // 페이지네이션 계산
  const totalPages = Math.ceil(processed.length / POSTS_PER_PAGE) || 1;
  const displayPages = getDisplayPages(totalPages, currentPage);
  const visiblePosts = useMemo(
    () => processed.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE),
    [processed, currentPage],
  );

  // 페이지 변경 시 스크롤
  useEffect(() => {
    if (currentPage > 1) {
      const topY =
        document.getElementById("posts-top")?.getBoundingClientRect().top! + window.scrollY;
      window.scrollTo({ top: topY, behavior: "smooth" });
    }
  }, [currentPage]);

  return (
    <section className="container mx-auto px-4 py-8">
      {/* 상단 컨트롤 */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        {/* 정렬 옵션 */}
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

        {/* 카테고리 필터 */}
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
        {loading ? (
          Array.from({ length: POSTS_PER_PAGE }).map((_, i) => <SkeletonCard key={i} />)
        ) : visiblePosts.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">게시글이 없습니다.</div>
        ) : (
          visiblePosts.map((post) => (
            <Link
              to={`/communitydetail/${post.id}`}
              key={post.id}
              className="flex flex-col h-full bg-gray-800 rounded-lg shadow hover:shadow-lg transition overflow-hidden"
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
                className="w-full aspect-video object-cover"
              />
              <div className="flex-1 flex flex-col p-4">
                <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">
                  {post.community_title}
                </h3>
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
                      {post.comment_count}
                    </span>
                    <span className="flex items-center">
                      <Icons name="eye" className="w-4 h-4 mr-1" />
                      {post.community_views}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {!loading && visiblePosts.length > 0 && (
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
                onClick={() => setCurrentPage(p)}
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
