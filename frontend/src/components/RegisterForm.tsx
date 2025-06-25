// /frontend/src/components/RegisterForm.tsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import TermsAgreement from "./TermsAgreement";
import type { RegisterData } from "../services/authService";
import { AuthContext } from "../providers/AuthProvider";

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAgreeForRegister = () => setStep(2);

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data: RegisterData = { username, email, password };
    setErrorMsg("");
    try {
      await register(data);
      navigate("/");
    } catch (error: any) {
      setErrorMsg(error.message || "회원가입 중 오류 발생");
    }
  };

  if (step === 1) {
    return (
      <div>
        <h2 className="text-center text-3xl font-bold mb-6">회원가입 약관 동의</h2>
        <TermsAgreement onAgree={handleAgreeForRegister} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-center text-3xl font-bold mb-6">회원가입</h2>
      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
      <form onSubmit={handleRegisterSubmit} className="space-y-5">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300">
            사용자 이름
          </label>
          <input
            id="username"
            type="text"
            placeholder="사용자 이름을 입력하세요"
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
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
          className="w-full py-2 px-4 bg-green-600 rounded hover:bg-green-700 transition-all duration-300"
        >
          회원가입
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
