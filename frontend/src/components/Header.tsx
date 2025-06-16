// /frontend/src/components/Header.tsx
import React, { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import Icons from "./Icons";
import SearchResults from "./SearchResults";

const Header: React.FC = () => {
  const location = useLocation();
  const [searchActive, setSearchActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // onBlur 시 타임아웃을 관리하여 재활성화 문제를 방지
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navItems = [
    { key: "news", label: "뉴스", path: "/news" },
    { key: "market", label: "마켓", path: "/market" },
    { key: "community", label: "커뮤니티", path: "/community" },
  ];

  // 검색 버튼 클릭 시 타임아웃 취소 후 검색 활성화 및 포커스
  const handleSearchClick = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setSearchActive(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // 검색 입력창 포커스 해제 시 약간의 딜레이 후 검색 모드 비활성화
  const handleSearchBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setSearchActive(false);
      setSearchTerm("");
    }, 150);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black to-transparent text-white px-6 py-4">
      {/* 좌측: 로고, 우측: 로그인 버튼는 일반 flex로 배치하고,
          중앙 네비게이션 영역은 별도의 절대 위치 컨테이너로 처리 */}
      <div className="relative container mx-auto flex items-center justify-between">
        {/* 좌측: 로고 (화면 좁아지면 텍스트는 숨김) */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center cursor-pointer">
            <img src="/logo.svg" alt="Logo" className="h-10 w-auto" />
            <span className="ml-2 text-xl font-bold hidden lg:inline-block">STOCKPANZEE</span>
          </Link>
        </div>
        {/* 우측: 로그인 버튼 */}
        <div className="flex items-center">
          <Link to="/auth/login">
            <button className="p-2 transition-all duration-300 cursor-pointer hover:bg-white/30 hover:rounded-full">
              <Icons name="user" className="w-8 h-8" />
            </button>
          </Link>
        </div>
        {/* 중앙: 네비게이션 및 검색 영역 - 절대 위치로 배치하여 항상 브라우저 중심에 위치 */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {/* 검색 미활성 시 네비게이션 레이어 */}
          {!searchActive && (
            <div className="flex items-center space-x-4 transition-all duration-300">
              <button
                onClick={handleSearchClick}
                className="p-2 transition-all duration-300 cursor-pointer hover:bg-white/30 hover:rounded-full"
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
                    className={`px-4 py-1 transition-all duration-300 cursor-pointer whitespace-nowrap ${
                      isActive ? "text-blue-500" : "hover:bg-white/30 hover:rounded-full"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* 검색 활성 시, 검색 입력창 및 검색 결과 오버레이 영역 */}
          {searchActive && (
            <div
              className="flex flex-col items-center transition-all duration-300 ease-in-out"
              style={{
                width: searchActive ? "20rem" : "0rem",
                opacity: searchActive ? 1 : 0,
                pointerEvents: searchActive ? "auto" : "none",
              }}
            >
              <div className="relative">
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
                {searchActive && searchTerm && <SearchResults searchTerm={searchTerm} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
