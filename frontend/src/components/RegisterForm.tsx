// /frontend/src/components/RegisterForm.tsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import TermsAgreement from "./TermsAgreement";
import type { RegisterData } from "../services/authService";
import { AuthContext } from "../providers/AuthProvider";
import { validateSignUp } from "../utils/validator";
import type { SignUpErrors } from "../utils/validator";

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<SignUpErrors>({});
  const [submitError, setSubmitError] = useState("");

  // 입력값이 모두 유효할 때만 폼 제출 허용
  const isFormValid =
    username.trim().length >= 2 &&
    email.trim() !== "" &&
    password !== "" &&
    Object.keys(validateSignUp({ username, email, password })).length === 0;

  const handleAgreeForRegister = () => setStep(2);

  const handleRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError("");

    // 전체 검증
    const validationErrors = validateSignUp({ username, email, password });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    // API 호출
    try {
      const data: RegisterData = { username, email, password };
      await register(data);
      navigate("/");
    } catch (err: any) {
      setSubmitError(err.message || "회원가입 중 오류가 발생했습니다.");
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
    <div className="max-w-md mx-auto">
      <h2 className="text-center text-3xl font-bold mb-6">회원가입</h2>

      {submitError && <p className="text-red-500 text-center mb-4">{submitError}</p>}

      <form onSubmit={handleRegisterSubmit} className="space-y-6">
        {/* 사용자 이름 */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300">
            사용자 이름
          </label>
          <input
            id="username"
            type="text"
            placeholder="최소 2글자"
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors((prev) => ({
                ...prev,
                username: validateSignUp({
                  username: e.target.value,
                  email,
                  password,
                }).username,
              }));
            }}
          />
          {errors.username && <p className="mt-1 text-sm text-red-500">{errors.username}</p>}
        </div>

        {/* 이메일 */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300">
            이메일
          </label>
          <input
            id="email"
            type="email"
            placeholder="예: example@domain.com"
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({
                ...prev,
                email: validateSignUp({
                  username,
                  email: e.target.value,
                  password,
                }).email,
              }));
            }}
          />
          {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
        </div>

        {/* 비밀번호 */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            placeholder="최소 8자 (숫자+특수문자 포함)"
            className="mt-1 block w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({
                ...prev,
                password: validateSignUp({
                  username,
                  email,
                  password: e.target.value,
                }).password,
              }));
            }}
          />
          {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={!isFormValid}
          className={`w-full py-2 px-4 bg-green-600 rounded text-white transition ${
            !isFormValid ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
          }`}
        >
          회원가입
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
