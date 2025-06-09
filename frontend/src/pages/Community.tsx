// src/components/Community.tsx
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Icons from "../components/Icons"; // clock, fire, angleLeft, angleRight, thumbsUp, messageDots 아이콘 지원

const Community: React.FC = () => {
  const [selectedSort, setSelectedSort] = useState("latest"); // "latest" 또는 "popular"
  const [selectedTab, setSelectedTab] = useState("전체"); // "전체", "국내", "해외", "암호화폐"
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 12;
  const totalPosts = 500; // 총 500개의 더미 게시글
  const pad = (num: number) => num.toString().padStart(2, "0");

  // 페이지 전환 시 스크롤 관리를 위한 ref
  const initialMountRef = useRef(true);
  const pageNavigationRef = useRef(false);

  // 더미 데이터 생성 – 각 게시글은 i시간 전 생성, 3개 카테고리 분리됨
  let domesticCount = 0,
    overseasCount = 0,
    cryptoCount = 0;
  const posts = Array.from({ length: totalPosts }, (_, i) => {
    const date = new Date(Date.now() - i * 3600 * 1000); // i시간 전
    const createdAt = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    let category: "국내" | "해외" | "암호화폐";
    let title = "";
    if (i % 3 === 0) {
      category = "국내";
      domesticCount++;
      title = `국내 ${domesticCount}`;
    } else if (i % 3 === 1) {
      category = "해외";
      overseasCount++;
      title = `해외 ${overseasCount}`;
    } else {
      category = "암호화폐";
      cryptoCount++;
      title = `암호화폐 ${cryptoCount}`;
    }
    return {
      id: i,
      title,
      category,
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec venenatis, metus at malesuada blandit, lorem felis cursus lacus, in cursus lacus libero vel nunc. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.",
      image: `/panzee.webp`,
      author: `User${i + 1}`,
      createdAt,
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 50),
    };
  });

  // 정렬 – 최신순(작성시간 내림차순) / 인기순(추천수 내림차순)
  const sortedPosts = posts.slice().sort((a, b) => {
    if (selectedSort === "latest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return b.likes - a.likes;
    }
  });

  // 탭 필터 – "전체"는 모두, 그 외는 해당 카테고리 게시글만 필터링
  const filteredPosts =
    selectedTab === "전체"
      ? sortedPosts
      : sortedPosts.filter((post) => post.category === selectedTab);

  // 페이지네이션 처리
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage,
  );

  // 페이지 번호 생략 헬퍼 함수 (totalPages가 7 이하이면 모두 표시, 그 외엔 앞뒤 2페이지 + 첫/마지막)
  const getDisplayPages = (totalPages: number, currentPage: number): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);
    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    // 왼쪽 표시: 만약 시작값이 2보다 크면 gap이 있는 것이므로 "..." 추가
    if (start > 2) {
      pages.push("...");
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    // 오른쪽 표시: 만약 end가 totalPages - 1보다 작으면 gap이 있는 것이므로 "..." 추가
    if (end < totalPages - 1) {
      pages.push("...");
    }
    pages.push(totalPages);
    return pages;
  };

  const displayedPages = getDisplayPages(totalPages, currentPage);

  // 페이지 버튼 클릭 시 상단 h1까지 부드럽게 스크롤
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
      {/* 데스크탑 컨트롤 영역 (md 이상) */}
      <div className="hidden md:flex items-center justify-between mb-6">
        {/* 좌측: 정렬 버튼 그룹 (세그먼티드 컨트롤 스타일, 정사각형 버튼) */}
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
        {/* 가운데: 네비 탭 버튼 그룹 (세그먼티드 컨트롤) */}
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
        {/* 우측: 글쓰기 버튼 */}
        <div>
          <Link to="/post">
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-full transition-colors duration-200 hover:from-blue-600 hover:to-blue-700">
              글쓰기
            </button>
          </Link>
        </div>
      </div>

      {/* 모바일 컨트롤 영역 (md 미만) */}
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
        {currentPosts.map((post) => (
          <div
            key={post.id}
            className="p-4 transition-colors duration-200 hover:bg-gray-800 rounded-md"
          >
            <img
              src={post.image}
              alt={post.title}
              className="w-full aspect-video object-cover rounded mb-3"
            />
            <h3 className="text-lg font-bold mb-1 text-white">{post.title}</h3>
            <p className="text-sm text-gray-300 mb-3 line-clamp-2">{post.content}</p>
            {/* 게시글 메타 정보 */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">{post.author}</div>
                <div className="text-sm text-gray-400">{post.createdAt}</div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="flex items-center text-sm text-gray-400">
                  <Icons name="thumbsUp" className="w-6 h-6 mr-1" />
                  {post.likes}
                </span>
                <span className="flex items-center text-sm text-gray-400">
                  <Icons name="messageDots" className="w-6 h-6 mr-1" />
                  {post.comments}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center mt-6 space-x-3">
        {/* 이전 버튼 */}
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
        {/* 페이지 번호 버튼 */}
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
        {/* 다음 버튼 */}
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
