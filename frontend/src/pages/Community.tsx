// /frontend/src/pages/Community.tsx
import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Icons from "../components/Icons";
import { AuthContext } from "../providers/AuthProvider";

// 게시글 타입 정의
interface CommunityPost {
  id: number;
  category: string;
  community_title: string;
  community_contents: string;
  community_img?: string | null;
  community_likes: number;
  community_views: number;
  created_at: string;
  nickname?: string;
  name?: string;
  comment_count?: number; // ← 댓글 수 (없으면 클라에서 fetch)
  img_url?: string;
}

const categoryList = ["전체", "국내", "해외", "암호화폐"];

// 시간 표시 함수 (DB가 UTC면 -9, 이미 KST면 삭제)
function timeAgo(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  date.setHours(date.getHours() - 9); // DB가 UTC면 -9, KST면 삭제!
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 0) return "방금 전";
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

const Community: React.FC = () => {
  const [selectedSort, setSelectedSort] = useState<"latest" | "popular">("latest");
  const [selectedTab, setSelectedTab] = useState<string>("전체");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const postsPerPage = 12;
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // 글쓰기 버튼 클릭 핸들러
  const handleWriteClick = () => {
    if (!user) {
      alert("로그인이 필요합니다. 로그인 후 이용해 주세요.");
      return;
    }
    navigate("/post");
  };

  // 게시글 불러오기 (comment_count가 없으면 직접 fetch)
  useEffect(() => {
    setLoading(true);
    axios
      .get<{ posts: CommunityPost[] } | CommunityPost[]>(
        `${import.meta.env.VITE_API_BASE_URL}/community`,
      )
      .then(async (res) => {
        let loadedPosts: CommunityPost[];
        if (Array.isArray(res.data)) loadedPosts = res.data;
        else if (Array.isArray(res.data.posts)) loadedPosts = res.data.posts;
        else loadedPosts = [];

        // comment_count가 없는 경우 직접 fetch
        const postsWithCounts = await Promise.all(
          loadedPosts.map(async (post) => {
            if (typeof post.comment_count === "number") return post;
            try {
              const res = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/community/${post.id}/comments`,
              );
              const count = Array.isArray(res.data) ? res.data.length : 0;
              return { ...post, comment_count: count };
            } catch {
              return { ...post, comment_count: 0 };
            }
          }),
        );
        setPosts(postsWithCounts);
        setLoading(false);
      })
      .catch((err) => {
        alert("게시글 불러오기 실패: " + (err.response?.data?.message || err.message));
        setPosts([]);
        setLoading(false);
      });
  }, [selectedSort, selectedTab, currentPage]);

  // 정렬/필터/페이지네이션
  let sortedPosts = posts;
  if (selectedSort === "latest") {
    sortedPosts = posts
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (selectedSort === "popular") {
    sortedPosts = posts.slice().sort((a, b) => (b.community_likes ?? 0) - (a.community_likes ?? 0));
  }

  const filteredPosts =
    selectedTab === "전체"
      ? sortedPosts
      : sortedPosts.filter((post) => post.category === selectedTab);

  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage,
  );

  // 페이지네이션
  const getDisplayPages = (totalPages: number, currentPage: number): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);
    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);
    return pages;
  };
  const displayedPages = getDisplayPages(totalPages, currentPage);

  // 스크롤 관리
  const initialMountRef = useRef(true);
  const pageNavigationRef = useRef(false);
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      return;
    }
    if (pageNavigationRef.current) {
      const h1Element = document.querySelector("h1");
      if (h1Element) {
        const y = h1Element.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      pageNavigationRef.current = false;
    }
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    pageNavigationRef.current = true;
    setCurrentPage(newPage);
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      {/* 데스크탑 컨트롤 */}
      <div className="hidden md:flex items-center justify-between mb-6">
        <div className="flex bg-gray-800 p-1 rounded-md border border-gray-600 space-x-2">
          <button
            onClick={() => {
              setSelectedSort("latest");
              setCurrentPage(1);
            }}
            className={`w-10 h-10 flex items-center justify-center transition-colors duration-200 text-white rounded-md ${
              selectedSort === "latest"
                ? "bg-white/30 text-blue-500"
                : "bg-transparent hover:bg-white/30"
            }`}
          >
            <Icons name="clock" className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setSelectedSort("popular");
              setCurrentPage(1);
            }}
            className={`w-10 h-10 flex items-center justify-center transition-colors duration-200 text-white rounded-md ${
              selectedSort === "popular"
                ? "bg-white/30 text-blue-500"
                : "bg-transparent hover:bg-white/30"
            }`}
          >
            <Icons name="fire" className="w-5 h-5" />
          </button>
        </div>
        <div className="hidden md:flex bg-gray-800 p-1 rounded-full space-x-2">
          {categoryList.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setSelectedTab(tab);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 transition-colors duration-200 text-white rounded-full ${
                selectedTab === tab
                  ? "bg-white/30 text-blue-500"
                  : "bg-transparent hover:bg-white/30"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div>
          <button
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full transition-colors duration-200 hover:from-blue-600 hover:to-blue-700"
            onClick={handleWriteClick}
          >
            글쓰기
          </button>
        </div>
      </div>

      {/* 모바일 컨트롤 */}
      <div className="flex md:hidden flex-col mb-6 space-y-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex bg-gray-800 p-1 rounded-md border border-gray-600 space-x-2">
            <button
              onClick={() => {
                setSelectedSort("latest");
                setCurrentPage(1);
              }}
              className={`w-10 h-10 flex items-center justify-center transition-colors duration-200 text-white rounded-md ${
                selectedSort === "latest"
                  ? "bg-white/30 text-blue-500"
                  : "bg-transparent hover:bg-white/30"
              }`}
            >
              <Icons name="clock" className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setSelectedSort("popular");
                setCurrentPage(1);
              }}
              className={`w-10 h-10 flex items-center justify-center transition-colors duration-200 text-white rounded-md ${
                selectedSort === "popular"
                  ? "bg-white/30 text-blue-500"
                  : "bg-transparent hover:bg-white/30"
              }`}
            >
              <Icons name="fire" className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex justify-center">
            <select
              value={selectedTab}
              onChange={(e) => {
                setSelectedTab(e.target.value);
                setCurrentPage(1);
              }}
              className="w-32 px-4 py-2 rounded-full bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categoryList.map((tab) => (
                <option key={tab} value={tab}>
                  {tab}
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full transition-colors duration-200 hover:from-blue-600 hover:to-blue-700"
              onClick={handleWriteClick}
            >
              글쓰기
            </button>
          </div>
        </div>
      </div>

      {/* 게시글 그리드 */}
      <div id="posts-top" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-400 py-12">불러오는 중...</div>
        ) : currentPosts.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-12">게시글이 없습니다.</div>
        ) : (
          currentPosts.map((post) => (
            <div
              key={post.id}
              className="p-4 transition-colors duration-200 hover:bg-gray-800 rounded-md"
            >
              <Link to={`/communitydetail/${post.id}`} className="block">
                {/* 썸네일 */}
                <img
                  src={
                    post.img_url
                      ? post.img_url.startsWith("/uploads/")
                        ? `http://localhost:5000${post.img_url}`
                        : post.img_url
                      : "/panzee.webp"
                  }
                  alt="썸네일"
                  className="w-full aspect-video object-cover rounded mb-3"
                />
                {/* 제목 */}
                <h3 className="text-lg font-bold mb-1 text-white line-clamp-2">
                  {post.community_title}
                </h3>
                {/* 본문요약 */}
                <p className="text-sm text-gray-300 mb-3 line-clamp-2">{post.community_contents}</p>
                {/* 카테고리 | 닉네임 */}
                <div className="flex justify-between items-center mb-1">
                  <span className="text-base text-white font-bold">{post.category}</span>
                  <span className="text-sm text-gray-400">
                    {post.nickname || post.name || "익명"}
                  </span>
                </div>
                {/* 시간 | 좋아요 | 댓글수 | 조회수 */}
                <div className="flex justify-between items-center text-sm text-gray-400">
                  <span>{timeAgo(post.created_at)}</span>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center">
                      <Icons name="thumbsUp" className="w-5 h-5 mr-1" />
                      {post.community_likes}
                    </span>
                    <span className="flex items-center">
                      <Icons name="messageDots" className="w-5 h-5 mr-1" />
                      {post.comment_count ?? 0}
                    </span>
                    <span className="flex items-center">
                      <Icons name="eye" className="w-5 h-5 mr-1" />
                      {post.community_views ?? 0}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center mt-6 space-x-3">
        <button
          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-10 h-10 rounded-md transition-colors duration-200 flex items-center justify-center ${
            currentPage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "text-white hover:text-gray-300"
          }`}
        >
          <Icons name="angleLeft" className="w-5 h-5" />
        </button>
        {displayedPages.map((page, index) =>
          typeof page === "number" ? (
            <button
              key={index}
              onClick={() => handlePageChange(page)}
              className={`w-10 h-10 transition-colors duration-200 cursor-pointer flex items-center justify-center rounded ${
                currentPage === page ? "text-blue-500 font-bold" : "text-white hover:text-gray-300"
              }`}
            >
              {page}
            </button>
          ) : (
            <div key={index} className="w-10 h-10 flex items-center justify-center text-gray-500">
              {page}
            </div>
          ),
        )}
        <button
          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-10 h-10 rounded-md transition-colors duration-200 flex items-center justify-center ${
            currentPage === totalPages
              ? "text-gray-400 cursor-not-allowed"
              : "text-white hover:text-gray-300"
          }`}
        >
          <Icons name="angleRight" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Community;
