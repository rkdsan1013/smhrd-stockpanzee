// src/components/RegisterForm.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TermsAgreement from "./TermsAgreement";

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: 약관 동의, 2: 회원가입 입력폼

  // 회원가입 입력폼 상태
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 약관 동의 후 처리
  const handleAgreeForRegister = () => {
    setStep(2);
  };

  // 회원가입 제출 처리 (임시 처리: 홈 이동)
  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate("/");
  };

  if (step === 1) {
    return (
      <div>
        <h2 className="text-center text-3xl font-bold mb-6">회원가입 약관 동의</h2>
        <TermsAgreement onAgree={handleAgreeForRegister} />
      </div>
    );
  } else {
    return (
      <div>
        <h2 className="text-center text-3xl font-bold mb-6">회원가입</h2>
        <form onSubmit={handleRegisterSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              사용자 이름
            </label>
            <input
              id="username"
              type="text"
              placeholder="사용자 이름을 입력하세요"
              className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              이메일
            </label>
            <input
              id="email"
              type="email"
              placeholder="이메일을 입력하세요"
              className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
              className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 rounded hover:bg-green-700 transition-all duration-300"
          >
            회원가입
          </button>
        </form>
      </div>
    );
  }
};

export default RegisterForm;
