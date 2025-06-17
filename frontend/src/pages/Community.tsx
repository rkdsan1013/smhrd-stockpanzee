//frontend/src/pages/community.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Icons from "../components/Icons";

const Community: React.FC = () => {
  const [selectedSort, setSelectedSort] = useState("latest");
  const [selectedTab, setSelectedTab] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;

  // 실제 API 데이터로 posts 상태값 관리 (초기값은 빈 배열)
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 실제 API 연동 (selectedSort, selectedTab, currentPage 활용 가능)
useEffect(() => {
  setLoading(true);
  axios
    .get(`${import.meta.env.VITE_API_BASE_URL}/community`)
    .then(res => {
      // 콘솔로 실제 백엔드 응답 구조 확인!
      console.log("API 응답:", res.data);

      // 1. 배열 형태면 바로 세팅
      if (Array.isArray(res.data)) {
        setPosts(res.data);
      }
      // 2. 객체에 posts라는 배열로 들어온 경우
      else if (Array.isArray(res.data.posts)) {
        setPosts(res.data.posts);
      }
      // 3. 아예 비었으면 빈 배열
      else {
        setPosts([]);
      }
      setLoading(false);
    })
    .catch(err => {
      alert("게시글 불러오기 실패: " + (err.response?.data?.message || err.message));
      setPosts([]);
      setLoading(false);
    });
}, [selectedSort, selectedTab, currentPage]);




  // 정렬/필터/페이지네이션 (백엔드에서 직접 처리해주는 게 더 효율적임)
  let sortedPosts = posts;
  if (selectedSort === "latest") {
    sortedPosts = posts.slice().sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } else if (selectedSort === "popular") {
    sortedPosts = posts.slice().sort(
      (a, b) => (b.community_likes ?? 0) - (a.community_likes ?? 0)
    );
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

  const getDisplayPages = (totalPages: number, currentPage: number): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);
    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    if (start > 2) {
      pages.push("...");
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (end < totalPages - 1) {
      pages.push("...");
    }
    pages.push(totalPages);
    return pages;
  };
  const displayedPages = getDisplayPages(totalPages, currentPage);

  // 스크롤 관리 (그대로 유지)
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
        {/* 정렬 */}
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
        {/* 카테고리 */}
        <div className="flex bg-gray-800 p-1 rounded-full space-x-2">
          {["전체", "국내", "해외", "암호화폐"].map((tab) => (
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
        {/* 글쓰기 */}
        <div>
          <Link to="/post">
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full transition-colors duration-200 hover:from-blue-600 hover:to-blue-700">
              글쓰기
            </button>
          </Link>
        </div>
      </div>

      {/* 모바일 컨트롤 */}
      <div className="flex md:hidden flex-col mb-6 space-y-4">
        <div className="flex items-center justify-between">
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
          <div>
            <Link to="/post">
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full transition-colors duration-200 hover:from-blue-600 hover:to-blue-700">
                글쓰기
              </button>
            </Link>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="flex bg-gray-800 p-1 rounded-full space-x-2">
            {["전체", "국내", "해외", "암호화폐"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 transition-colors duration-200 text-white rounded-full ${
                  selectedTab === tab
                    ? "bg-white/30 text-blue-500"
                    : "bg-transparent hover:bg-white/30"
                }`}
              >
                {tab}
              </button>
            ))}
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
            <Link to={`/communitydetail/${post.id}`} key={post.id} className="block">
              <div className="p-4 transition-colors duration-200 hover:bg-gray-800 rounded-md">
                <img
                  src={post.community_img
                    ? `data:image/jpeg;base64,${post.community_img}`
                    : "/panzee.webp"
                  }
                  alt="썸네일"
                  className="w-full aspect-video object-cover rounded mb-3"
                />
                <h3 className="text-lg font-bold mb-1 text-white">{post.community_title}</h3>
                <p className="text-sm text-gray-300 mb-3 line-clamp-2">{post.community_contents}</p>
                <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">{post.category}</div>
                  <div className="text-sm text-gray-400">{post.created_at}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-sm text-gray-400">
                    <Icons name="thumbsUp" className="w-6 h-6 mr-1" />
                    {post.community_likes}
                  </span>
                  <span className="flex items-center text-sm text-gray-400">
                    <Icons name="messageDots" className="w-6 h-6 mr-1" />
                    0
                  </span>
                </div>
              </div>
            </div>
            </Link>
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
