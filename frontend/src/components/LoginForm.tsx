// src/components/LoginForm.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icons from "./Icons";
import TermsAgreement from "./TermsAgreement";

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [googleStep, setGoogleStep] = useState(false);

  // 이메일 로그인 처리 (임시 처리: 홈 이동)
  const handleLocalLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate("/");
  };

  // Google 로그인 버튼 클릭 시 2단계 약관 동의로 전환
  const handleGoogleLoginClick = () => {
    setGoogleStep(true);
  };

  // 약관 동의 후 Google 로그인 (임시 처리)
  const handleAgreeForGoogle = () => {
    setGoogleStep(false);
    navigate("/");
    // 여기서 실제 Google OAuth 로직을 추가할 수 있습니다.
  };

  const handleCancelGoogleTerms = () => {
    setGoogleStep(false);
  };

  if (googleStep) {
    return (
      <div>
        <h2 className="text-center text-3xl font-bold mb-6">Google 계정 로그인 약관 동의</h2>
        <TermsAgreement onAgree={handleAgreeForGoogle} onCancel={handleCancelGoogleTerms} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-center text-3xl font-bold mb-6">로그인</h2>
      <form onSubmit={handleLocalLoginSubmit} className="space-y-5">
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
        onClick={handleGoogleLoginClick}
        className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-red-600 rounded hover:bg-red-700 transition-all duration-300"
      >
        <Icons name="google" className="w-6 h-6" />
        <span>Google 계정으로 로그인</span>
      </button>
    </div>
  );
};

export default LoginForm;
