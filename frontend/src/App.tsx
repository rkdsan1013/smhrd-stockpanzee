// /frontend/src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import AuthTemplate from "./pages/AuthTemplate";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Home from "./pages/Home";
import News from "./pages/News";
import Market from "./pages/Market";
import Community from "./pages/Community";
import PostCreationPage from "./pages/PostCreationPage";
import CommunityDetail from "./pages/CommunityDetail";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* 메인 레이아웃 하위 페이지 */}
        <Route path="/" element={<MainPage />}>
          <Route index element={<Home />} />
          <Route path="news" element={<News />} />
          <Route path="market" element={<Market />} />
          <Route path="community" element={<Community />} />
          {/* 포스팅 페이지: 글쓰기 버튼 눌렀을 때 이동 */}
          <Route path="post" element={<PostCreationPage />} />
          <Route path="/communitydetail/:id" element={<CommunityDetail />} />
        </Route>
        {/* 인증 관련 페이지 */}
        <Route path="/auth" element={<AuthTemplate />}>
          <Route index element={<LoginForm />} />
          <Route path="login" element={<LoginForm />} />
          <Route path="register" element={<RegisterForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
