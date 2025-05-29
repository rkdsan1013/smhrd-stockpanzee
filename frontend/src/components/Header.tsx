// src/components/Header.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import Icons from "./Icons";

const Header: React.FC = () => {
  const location = useLocation();

  // 중앙 내비게이션 항목: 내부 키는 영어, 표시 텍스트는 한글
  const navItems = [
    { key: "news", label: "뉴스", path: "/news" },
    { key: "market", label: "마켓", path: "/market" },
    { key: "community", label: "커뮤니티", path: "/community" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black to-transparent text-white px-6 py-4">
      <div className="container mx-auto grid grid-cols-3 items-center">
        {/* 좌측: 로고 영역 (홈으로 이동) */}
        <div className="flex items-center justify-start">
          <Link to="/" className="flex items-center cursor-pointer">
            <img src="/logo.svg" alt="Logo" className="h-10 w-auto" />
            <span className="ml-2 text-xl font-bold hidden md:inline-block">STOCKPANZEE</span>
          </Link>
        </div>
        {/* 중앙: 내비게이션 버튼 */}
        <div className="flex items-center justify-center">
          <nav className="flex space-x-4 whitespace-nowrap text-base">
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
          </nav>
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
