// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import AuthTemplate from "./pages/AuthTemplate";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        {/* 인증 관련 페이지: /auth 하위에서 공통 템플릿을 활용 */}
        <Route path="/auth" element={<AuthTemplate />}>
          {/* 기본은 로그인 폼 */}
          <Route index element={<LoginForm />} />
          <Route path="login" element={<LoginForm />} />
          <Route path="register" element={<RegisterForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
