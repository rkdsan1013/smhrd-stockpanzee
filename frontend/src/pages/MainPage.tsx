// src/pages/MainPage.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const MainPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      {/* pt-20은 헤더 높이에 맞춰 본문 상단 패딩을 줍니다. */}
      <main className="pt-20 container mx-auto flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainPage;
