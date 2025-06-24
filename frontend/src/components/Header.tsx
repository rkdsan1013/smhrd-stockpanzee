// /frontend/src/components/Header.tsx
import React, { useState, useRef, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import Icons from "./Icons";
import SearchResults from "./SearchResults";
import { AuthContext } from "../providers/AuthProvider";

const Header: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const [searchActive, setSearchActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navItems = [
    { key: "news", label: "뉴스", path: "/news" },
    { key: "market", label: "마켓", path: "/market" },
    { key: "community", label: "커뮤니티", path: "/community" },
  ];

  const handleSearchClick = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setSearchActive(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSearchBlur = () => {
    blurTimeoutRef.current = setTimeout(() => {
      setSearchActive(false);
      setSearchTerm("");
    }, 150);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black to-transparent text-white px-6 py-4">
      <div className="relative container mx-auto flex items-center justify-between">
        {/* 좌측: 로고 */}
        <Link to="/" className="flex items-center">
          <img src="/logo.svg" alt="Logo" className="h-10 w-auto" />
          <span className="ml-2 text-xl font-bold hidden lg:inline-block">STOCKPANZEE</span>
        </Link>

        {/* 우측: 로그인/유저네임 */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="px-3 py-1 bg-white/20 rounded-full">{user.username}</span>
              <button onClick={logout} className="text-sm hover:underline">
                로그아웃
              </button>
            </>
          ) : (
            <Link to="/auth/login">
              <button className="p-2 hover:bg-white/30 rounded-full">
                <Icons name="user" className="w-8 h-8" />
              </button>
            </Link>
          )}
        </div>

        {/* 중앙: 네비게이션 & 검색 */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {!searchActive ? (
            <div className="flex items-center space-x-4">
              <button onClick={handleSearchClick} className="p-2 hover:bg-white/30 rounded-full">
                <Icons name="search" className="w-6 h-6" />
              </button>
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.path || location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.key}
                    to={item.path}
                    className={`px-4 py-1 whitespace-nowrap ${
                      isActive ? "text-blue-500" : "hover:bg-white/30 rounded-full"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div
              className="flex flex-col items-center transition-all duration-300 ease-in-out"
              style={{
                width: "20rem",
                opacity: 1,
                pointerEvents: "auto",
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
                    width: "20rem",
                    opacity: 1,
                    pointerEvents: "auto",
                  }}
                />
                {searchTerm && <SearchResults searchTerm={searchTerm} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
