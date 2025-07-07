// /frontend/src/components/Header.tsx
import React, { useState, useRef, useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Icons from "./Icons";
import Notification from "./Notification";
import { AuthContext } from "../providers/AuthProvider";

const Header: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const pathname = location.pathname;

  // 유저 메뉴
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 알림 팝업
  const [notifOpen, setNotifOpen] = useState(false);
  const notifAnchorRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [menuOpen]);

  const navItems = [
    { key: "news", label: "뉴스", path: "/news" },
    { key: "market", label: "마켓", path: "/market" },
    { key: "community", label: "팬지's TALK", path: "/community" },
  ];

  const handleNotifClick = () => {
    setMenuOpen(false);
    setNotifOpen((o) => !o);
  };
  const handleMenuClick = () => {
    setNotifOpen(false);
    setMenuOpen((o) => !o);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black to-transparent px-6 py-4">
      <div className="container mx-auto flex items-center justify-between text-white">
        {/* 로고 */}
        <Link to="/" className="flex items-center">
          <img src="/logo.svg" alt="Logo" className="h-10 w-auto" />
          <span className="ml-2 text-xl font-bold hidden lg:inline">STOCKPANZEE</span>
        </Link>

        {/* 중앙: 네비 */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="flex items-center space-x-4">
            {navItems.map((item) => {
              const isActive =
                pathname === item.path ||
                pathname.startsWith(item.path) ||
                // '/asset/*' 경로도 '마켓' 탭으로 간주
                (item.key === "market" && pathname.startsWith("/asset")) ||
                // '/post' 경로도 '팬지's TALK' 탭으로 간주
                (item.key === "community" && pathname.startsWith("/post"));

              return (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`px-4 py-1 whitespace-nowrap rounded-full transition ${
                    isActive ? "text-blue-500" : "text-gray-300 hover:bg-white/30 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* 우측: 알림 + 프로필 */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="relative">
                <button
                  ref={notifAnchorRef}
                  onClick={handleNotifClick}
                  className="p-2 hover:bg-white/30 rounded-full transition"
                >
                  <Icons name="bell" className="w-8 h-8" />
                </button>
                {notifOpen && (
                  <Notification
                    isOpen={notifOpen}
                    onClose={() => setNotifOpen(false)}
                    anchorRef={notifAnchorRef}
                  />
                )}
              </div>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={handleMenuClick}
                  className="p-2 hover:bg-white/30 rounded-full transition"
                >
                  <Icons name="user" className="w-8 h-8" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white text-black rounded shadow-lg overflow-hidden z-50">
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
  );
};

export default Header;
