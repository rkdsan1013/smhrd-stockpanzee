// /frontend/src/components/LoginForm.tsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import type { LoginData } from "../services/authService";
import Icons from "./Icons";
import TermsAgreement from "./TermsAgreement";
import { AuthContext } from "../providers/AuthProvider";
import { getGoogleAuthUrl } from "../utils/googleAuth";

//const handleGoogleLoginClick = () => {
//  window.location.href = getGoogleAuthUrl();
//};


const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [googleStep, setGoogleStep] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLocalLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data: LoginData = { email, password };
    setErrorMsg("");
    try {
      await login(data);
      navigate("/");
    } catch (error: any) {
      setErrorMsg(error.message || "로그인 중 오류 발생");
    }
  };

  const handleGoogleLoginClick = () => setGoogleStep(true);
  const handleAgreeForGoogle = () => {
    setGoogleStep(false);
    window.location.href = getGoogleAuthUrl(); // 동의 버튼에서 바로 이동!
  };
  const handleCancelGoogleTerms = () => setGoogleStep(false);

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
      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
      <form onSubmit={handleLocalLoginSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            이메일
          </label>
          <input
            id="email"
            type="email"
            placeholder="이메일을 입력하세요"
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
