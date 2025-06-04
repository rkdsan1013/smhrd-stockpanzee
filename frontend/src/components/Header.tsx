// src/components/Header.tsx
import React, { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import Icons from "./Icons";

const Header: React.FC = () => {
  const location = useLocation();
  const [searchActive, setSearchActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 기본 네비게이션 항목 (검색 버튼 포함)
  const navItems = [
    { key: "news", label: "뉴스", path: "/news" },
    { key: "market", label: "마켓", path: "/market" },
    { key: "community", label: "커뮤니티", path: "/community" },
  ];

  // 검색 버튼 클릭: 검색 모드 활성화 및 입력창에 포커스
  const handleSearchClick = () => {
    setSearchActive(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // 검색 입력창 포커스 해제 시: 검색 모드 비활성화
  const handleSearchBlur = () => {
    setTimeout(() => {
      setSearchActive(false);
      setSearchTerm("");
    }, 150);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black to-transparent text-white px-6 py-4">
      <div className="container mx-auto grid grid-cols-3 items-center">
        {/* 좌측: 로고 */}
        <div className="flex items-center justify-start">
          <Link to="/" className="flex items-center cursor-pointer">
            <img src="/logo.svg" alt="Logo" className="h-10 w-auto" />
            <span className="ml-2 text-xl font-bold hidden md:inline-block">STOCKPANZEE</span>
          </Link>
        </div>
        {/* 중앙: 네비게이션 & 검색 영역 */}
        <div className="relative flex items-center justify-center w-full">
          {/* 기본 네비게이션 레이어 */}
          <div
            className={`flex items-center space-x-4 transition-opacity duration-300 ${
              searchActive ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            {/* 검색 버튼 (아이콘만) */}
            <button
              onClick={handleSearchClick}
              className="transition-all duration-300 p-2 cursor-pointer hover:bg-white/30 hover:rounded-full"
            >
              <Icons name="search" className="w-6 h-6" />
            </button>
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path || location.pathname.indexOf(item.path) === 0;
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`transition-all duration-300 px-4 py-1 cursor-pointer ${
                    isActive ? "text-blue-500" : "hover:bg-white/30 hover:rounded-full"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
          {/* 검색 입력창 오버레이 레이어 */}
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-300"
            style={{ zIndex: 10 }}
          >
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onBlur={handleSearchBlur}
              placeholder="검색어를 입력하세요..."
              className="bg-white text-black rounded-full px-4 py-2 outline-none transition-all duration-300 ease-in-out"
              style={{
                width: searchActive ? "20rem" : "0rem",
                opacity: searchActive ? 1 : 0,
                pointerEvents: searchActive ? "auto" : "none",
              }}
            />
          </div>
        </div>
        {/* 우측: 로그인 버튼 */}
        <div className="flex items-center justify-end">
          <Link to="/auth/login">
            <button className="transition-all duration-300 p-2 cursor-pointer hover:bg-white/30 hover:rounded-full">
              <Icons name="user" className="w-8 h-8" />
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
