// /frontend/src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import AuthTemplate from "./pages/AuthTemplate";
import LoginForm from "./components/LoginForm";
import GoogleCallback from "./pages/GoogleCallback";
import RegisterForm from "./components/RegisterForm";
import Home from "./pages/Home";
import News from "./pages/News";
import NewsDetail from "./pages/NewsDetail";
import Market from "./pages/Market";
import AssetDetail from "./pages/AssetDetail";
import EditProfilePage from "./pages/EditProfilePage";
import Community from "./pages/Community";
import PostCreationPage from "./pages/PostCreationPage";
import CommunityDetail from "./pages/CommunityDetail";
import PostEditPage from "./pages/PostEditPage";
import Alert from "./components/Alert";
import AppProvider from "./providers/AppProvider";

// 방금 만든 ScrollToTop 컴포넌트 import
import ScrollToTop from "./components/ScrollToTop";

const App: React.FC = () => {
  return (
    <AppProvider>
      <Alert />

      <BrowserRouter>
        {/* 경로 변경 시 항상 최상단으로 스크롤 */}
        <ScrollToTop />

        <Routes>
          {/* 메인 레이아웃 하위 페이지 */}
          <Route path="/" element={<MainPage />}>
            <Route index element={<Home />} />
            <Route path="news" element={<News />} />
            <Route path="news/:id" element={<NewsDetail />} />
            <Route path="market" element={<Market />} />
            <Route path="asset/:id" element={<AssetDetail />} />
            <Route path="community" element={<Community />} />
            <Route path="post" element={<PostCreationPage />} />
            <Route path="post/edit/:id" element={<PostEditPage />} />
            <Route path="communitydetail/:id" element={<CommunityDetail />} />
            <Route path="profile/edit" element={<EditProfilePage />} />
          </Route>

          {/* 인증 관련 페이지 (로그인/회원가입 등) */}
          <Route path="/auth" element={<AuthTemplate />}>
            <Route index element={<LoginForm />} />
            <Route path="login" element={<LoginForm />} />
            <Route path="google/callback" element={<GoogleCallback />} />
            <Route path="register" element={<RegisterForm />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
