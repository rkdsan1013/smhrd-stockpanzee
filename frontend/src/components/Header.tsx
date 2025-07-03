// /frontend/src/components/Header.tsx
import React, { useState, useRef, useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Icons from "./Icons";
import SearchResults from "./SearchResults";
import Notification from "./Notification";
import { AuthContext } from "../providers/AuthProvider";

const Header: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  // 검색 상태
  const [searchActive, setSearchActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 드롭다운 메뉴 상태 & ref
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 알림 팝오버 상태 & ref
  const [notifOpen, setNotifOpen] = useState(false);
  const notifAnchorRef = useRef<HTMLButtonElement>(null);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  // 검색 활성화/비활성화
  const activateSearch = () => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setSearchActive(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };
  const deactivateSearch = () => {
    blurTimeout.current = setTimeout(() => {
      setSearchActive(false);
      setSearchTerm("");
    }, 150);
  };

  // nav items
  const navItems = [
    { key: "news", label: "뉴스", path: "/news" },
    { key: "market", label: "마켓", path: "/market" },
    { key: "community", label: "팬지's TALK", path: "/community" },
  ];

  // 알림 버튼 클릭: 메뉴 닫고 알림 토글
  const handleNotifClick = () => {
    setMenuOpen(false);
    setNotifOpen((o) => !o);
  };

  // 프로필 버튼 클릭: 알림 닫고 메뉴 토글
  const handleMenuClick = () => {
    setNotifOpen(false);
    setMenuOpen((o) => !o);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black to-transparent px-6 py-4">
        <div className="container mx-auto flex items-center justify-between text-white">
          {/* 로고 */}
          <Link to="/" className="flex items-center">
            <img src="/logo.svg" alt="Logo" className="h-10 w-auto" />
            <span className="ml-2 text-xl font-bold hidden lg:inline">STOCKPANZEE</span>
          </Link>

          {/* 중앙: 네비 + 검색 */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            {!searchActive ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={activateSearch}
                  className="p-2 hover:bg-white/30 rounded-full transition"
                >
                  <Icons name="search" className="w-6 h-6" />
                </button>
                {navItems.map((item) => {
                  const isActive =
                    location.pathname === item.path || location.pathname.startsWith(item.path);
                  return (
                    <Link
                      key={item.key}
                      to={item.path}
                      className={`px-4 py-1 whitespace-nowrap rounded-full transition focus:outline-none ${
                        isActive
                          ? "text-blue-500"
                          : "text-gray-300 hover:bg-white/30 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center" style={{ width: "20rem" }}>
                <div className="relative w-full">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={deactivateSearch}
                    placeholder="검색어를 입력하세요..."
                    className="w-full bg-white text-black rounded-full px-4 py-2 outline-none transition-all duration-300 ease-in-out"
                  />
                  {searchTerm && <SearchResults searchTerm={searchTerm} />}
                </div>
              </div>
            )}
          </div>

          {/* 우측: 메시지 / 사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* 알림 버튼 & 팝오버 */}
                <div className="relative">
                  <button
                    ref={notifAnchorRef}
                    onClick={handleNotifClick}
                    className="p-2 hover:bg-white/30 rounded-full transition"
                  >
                    <Icons name="messageDots" className="w-8 h-8" />
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2">
                      <Notification
                        isOpen
                        onClose={() => setNotifOpen(false)}
                        anchorRef={notifAnchorRef}
                      />
                    </div>
                  )}
                </div>

                {/* 프로필 버튼 & 드롭다운 */}
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={handleMenuClick}
                    className="p-2 hover:bg-white/30 rounded-full transition"
                  >
                    <Icons name="user" className="w-8 h-8" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-44 bg-white text-black rounded shadow-lg z-50 overflow-hidden">
                      <div className="px-4 py-2 border-b border-gray-200 font-semibold">
                        {user.username}
                      </div>
                      <Link
                        to="/profile/edit"
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        프로필 수정
                      </Link>
                      <button
                        onClick={async () => {
                          await logout();
                          setMenuOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link to="/auth/login">
                <button className="p-2 hover:bg-white/30 rounded-full transition">
                  <Icons name="arrowLeftToBracket" className="w-8 h-8" />
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
