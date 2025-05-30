// src/pages/AuthTemplate.tsx
import React from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import Icons from "../components/Icons";

const AuthTemplate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRegister = location.pathname.includes("/register");

  const handleClose = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex flex-col md:flex-row">
        {/* 좌측 영역: 이미지 (md 이상에서 표시) */}
        <div className="hidden md:block md:w-1/2 pl-4 pr-0 pt-4 pb-4 relative min-h-screen">
          <div
            className="absolute top-4 left-4 bottom-4 right-0 bg-cover bg-center rounded-lg"
            style={{ backgroundImage: "url('/panzee.webp')" }}
          ></div>
          <div className="absolute bottom-12 left-0 right-0 text-center text-gray-950 select-none">
            <p className="text-5xl font-bold">JUST BUY</p>
            <p className="text-5xl font-bold">DON'T THINK</p>
          </div>
        </div>

        {/* 우측 영역: 인증 폼 */}
        <div className="w-full md:w-1/2 flex flex-col min-h-screen">
          {/* 상단 헤더: 로고와 Close 버튼 */}
          <div className="p-6 mx-4 border-b border-gray-700 relative flex items-center justify-center">
            <div className="flex items-center">
              <img src="/logo.svg" alt="Logo" className="h-10 w-auto" />
              <span className="ml-2 text-xl font-bold">STOCKPANZEE</span>
            </div>
            <button
              onClick={handleClose}
              className="absolute right-6 transition-all duration-300 p-2"
            >
              <Icons
                name="close"
                className="w-8 h-8 text-white transition-all duration-300 hover:text-gray-300"
              />
            </button>
          </div>

          {/* 중앙 영역: 인증 폼 */}
          <div className="flex-grow flex items-center justify-center px-6 py-8">
            <div className="w-full max-w-sm">
              <Outlet />
            </div>
          </div>

          {/* 하단 전환 링크 영역 - 상단 헤더와 동일한 좌우 여백과 구분선 적용 */}
          <div className="mx-4 border-t border-gray-700 px-6 py-4 text-center text-base font-medium">
            {isRegister ? (
              <span>
                이미 계정이 있으신가요?{" "}
                <Link to="/auth/login" replace className="text-blue-500">
                  로그인
                </Link>
              </span>
            ) : (
              <span>
                계정이 없으신가요?{" "}
                <Link to="/auth/register" replace className="text-blue-500">
                  회원가입
                </Link>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTemplate;
