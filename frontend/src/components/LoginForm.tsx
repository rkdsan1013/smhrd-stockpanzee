// src/components/LoginForm.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Icons from "./Icons";

const LoginForm: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // 로그인 성공 후 예시로 홈으로 이동합니다.
    navigate("/");
  };

  return (
    <div>
      <h2 className="text-center text-3xl font-bold mb-6">로그인</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            이메일
          </label>
          <input
            id="email"
            type="email"
            placeholder="이메일을 입력하세요"
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            placeholder="비밀번호를 입력하세요"
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 rounded hover:bg-blue-700 transition-all duration-300"
        >
          로그인
        </button>
      </form>
      <div className="flex items-center my-6">
        <div className="flex-grow border-t border-gray-600"></div>
        <span className="px-2 text-sm text-gray-400">또는</span>
        <div className="flex-grow border-t border-gray-600"></div>
      </div>
      <button
        type="button"
        className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-red-600 rounded hover:bg-red-700 transition-all duration-300"
      >
        <Icons name="google" className="w-6 h-6" />
        <span>Google 계정으로 로그인</span>
      </button>
    </div>
  );
};

export default LoginForm;
