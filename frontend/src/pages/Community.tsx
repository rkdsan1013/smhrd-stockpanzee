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

  // ref: 초기 마운트 시 자동 스크롤 방지
  const initialMountRef = useRef(true);
  // ref: 페이지 이동(하단 페이지 버튼 클릭)때에만 스크롤하도록 표시
  const pageNavigationRef = useRef(false);

  // 더미 데이터 생성
  // 각 게시글은 현재 시간 기준으로 i시간 전으로 생성되며,
  // i % 3 값에 따라 "국내", "해외", "암호화폐" 카테고리를 나누고 제목은 해당 카테고리의 순번으로 설정합니다.
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

  // 정렬: "latest"는 작성시간 내림차순, "popular"는 추천수 내림차순
  const sortedPosts = posts.slice().sort((a, b) => {
    if (selectedSort === "latest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return b.likes - a.likes;
    }
  });

  // 탭 필터: "전체"는 모두, 그 외는 해당 카테고리만 표시
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

  // 헬퍼 함수: 페이지 번호 생략 처리, 현재 페이지 기준 앞뒤 2페이지, 첫/마지막 페이지 표시
  const getDisplayPages = (totalPages: number, currentPage: number): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let pages: (number | string)[] = [];
    pages.push(1);
    if (currentPage > 3) {
      pages.push("...");
    }
    const start = Math.max(2, currentPage - 2);
    const end = Math.min(totalPages - 1, currentPage + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) {
      pages.push("...");
    }
    pages.push(totalPages);
    return pages;
  };

  const displayedPages = getDisplayPages(totalPages, currentPage);

  // 페이지 버튼 클릭 시 자동 스크롤: 하단 페이지 버튼 클릭시에만 h1(상단 텍스트)까지 스크롤
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
      {/* 상단 텍스트 */}
      <h1 className="text-4xl font-bold mb-8 text-white text-center">테스트 Community.</h1>

      {/* 데스크톱 컨트롤 영역 (md 이상) */}
      <div className="hidden md:flex items-center justify-between mb-6">
        {/* 좌측: 인기/시간순 버튼 그룹 */}
        <div className="inline-flex border-2 border-gray-600 rounded-md p-1 space-x-1">
          <button
            onClick={() => {
              setSelectedSort("latest");
              setCurrentPage(1);
            }}
            className={`w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-300 ${
              selectedSort === "latest"
                ? "bg-white/30 text-white rounded-md hover:bg-white/30"
                : "bg-transparent text-white hover:bg-white/30 hover:rounded-md"
            }`}
          >
            <Icons name="clock" className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setSelectedSort("popular");
              setCurrentPage(1);
            }}
            className={`w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-300 ${
              selectedSort === "popular"
                ? "bg-white/30 text-white rounded-md hover:bg-white/30"
                : "bg-transparent text-white hover:bg-white/30 hover:rounded-md"
            }`}
          >
            <Icons name="fire" className="w-5 h-5" />
          </button>
        </div>
        {/* 가운데: 네비 탭 버튼 그룹 */}
        <div className="flex space-x-2">
          {["전체", "국내", "해외", "암호화폐"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setSelectedTab(tab);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded transition-all duration-300 text-white cursor-pointer ${
                selectedTab === tab
                  ? "bg-white/30 rounded-full"
                  : "bg-transparent hover:bg-white/30 hover:rounded-full"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* 우측: 글쓰기 버튼 */}
        <div>
          <Link to="/post">
            <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold rounded-full shadow-md transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600 hover:shadow-lg hover:opacity-90 cursor-pointer">
              글쓰기
            </button>
          </Link>
        </div>
      </div>

      {/* 모바일 컨트롤 영역 (md 미만) */}
      <div className="flex md:hidden flex-col mb-6 space-y-4">
        <div className="flex items-center justify-between">
          {/* 좌측: 인기/시간순 버튼 그룹 */}
          <div className="inline-flex border-2 border-gray-600 rounded-md p-1 space-x-1">
            <button
              onClick={() => {
                setSelectedSort("latest");
                setCurrentPage(1);
              }}
              className={`w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                selectedSort === "latest"
                  ? "bg-white/30 text-white rounded-md hover:bg-white/30"
                  : "bg-transparent text-white hover:bg-white/30 hover:rounded-md"
              }`}
            >
              <Icons name="clock" className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setSelectedSort("popular");
                setCurrentPage(1);
              }}
              className={`w-10 h-10 flex items-center justify-center cursor-pointer transition-all duration-300 ${
                selectedSort === "popular"
                  ? "bg-white/30 text-white rounded-md hover:bg-white/30"
                  : "bg-transparent text-white hover:bg-white/30 hover:rounded-md"
              }`}
            >
              <Icons name="fire" className="w-5 h-5" />
            </button>
          </div>
          {/* 우측: 글쓰기 버튼 */}
          <div>
            <Link to="/post">
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold rounded-full shadow-md transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-400 hover:to-blue-600 hover:shadow-lg hover:opacity-90 cursor-pointer">
                글쓰기
              </button>
            </Link>
          </div>
        </div>
        {/* 아래: 중앙 정렬된 네비 탭 버튼 그룹 */}
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {["전체", "국내", "해외", "암호화폐"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setSelectedTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-3 py-2 rounded transition-all duration-300 text-white cursor-pointer ${
                  selectedTab === tab
                    ? "bg-white/30 rounded-full"
                    : "bg-transparent hover:bg-white/30 hover:rounded-full"
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
            className="p-4 transition-colors duration-300 hover:bg-gray-800 rounded-md"
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

      {/* 페이지 이동 버튼 */}
      <div className="flex justify-center mt-6 space-x-2">
        {/* 이전 버튼 */}
        <button
          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`w-10 h-10 rounded-md transition-all duration-300 cursor-pointer flex items-center justify-center ${
            currentPage === 1
              ? "border border-gray-500 text-white opacity-50 cursor-not-allowed"
              : "border border-gray-700 text-white hover:bg-gray-700 hover:text-white"
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
              className={`w-10 h-10 rounded-md transition-all duration-300 cursor-pointer flex items-center justify-center ${
                currentPage === page
                  ? "bg-blue-600 border border-blue-600 text-white"
                  : "bg-transparent text-white hover:bg-gray-700 hover:text-white"
              }`}
            >
              {page}
            </button>
          ) : (
            <div key={index} className="w-10 h-10 flex items-center justify-center text-gray-400">
              {page}
            </div>
          ),
        )}

        {/* 다음 버튼 */}
        <button
          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`w-10 h-10 rounded-md transition-all duration-300 cursor-pointer flex items-center justify-center ${
            currentPage === totalPages
              ? "border border-gray-500 text-white opacity-50 cursor-not-allowed"
              : "border border-gray-700 text-white hover:bg-gray-700 hover:text-white"
          }`}
        >
          <Icons name="angleRight" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Community;
