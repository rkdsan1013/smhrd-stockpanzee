import React from "react";
import { Link } from "react-router-dom"; // react-router-dom 임포트 추가
import Icons from "./Icons";

interface HeaderProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeMenu, setActiveMenu }) => {
  // 중앙 내비게이션 항목: 내부 키는 영어, 표시 텍스트는 한글
  const navItems = [
    { key: "news", label: "뉴스" },
    { key: "market", label: "마켓" },
    { key: "community", label: "커뮤니티" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black to-transparent text-white px-6 py-4">
      <div className="container mx-auto grid grid-cols-3 items-center">
        {/* 좌측: 로고 영역 (클릭 시 activeMenu를 "home"으로 변경) */}
        <div className="flex items-center justify-start">
          <div className="flex items-center cursor-pointer" onClick={() => setActiveMenu("home")}>
            <img src="/logo.svg" alt="Logo" className="h-10 w-auto" />
            <span className="ml-2 text-xl font-bold hidden md:inline-block">STOCKPANZEE</span>
          </div>
        </div>
        {/* 중앙: 내비게이션 버튼 */}
        <div className="flex items-center justify-center">
          <nav className="flex space-x-4 whitespace-nowrap text-base">
            {navItems.map((item) => {
              const isActive = activeMenu === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveMenu(item.key)}
                  className={`transition-all duration-300 px-4 py-1 ${
                    isActive ? "text-blue-500" : "hover:bg-white/30 hover:rounded-full"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
        {/* 우측: 로그인 버튼 -> Link를 사용하여 /login 경로로 이동 */}
        <div className="flex items-center justify-end">
          <Link to="/auth/login">
            <button className="transition-all duration-300 p-2 hover:bg-white/30 hover:rounded-full">
              <Icons name="user" className="w-8 h-8" />
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
