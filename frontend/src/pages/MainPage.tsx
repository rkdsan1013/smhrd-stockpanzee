// /frontend/src/pages/MainPage.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ChatbotButton from "../components/Chatbot";
import TickerTape from "../components/TickerTape";

const MainPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col relative">
      <Header />
      {/* 헤더 높이에 맞춰 본문 상단 패딩을 pt-28로 증가 */}
      <main className="pt-28 container mx-auto flex-grow">
        <Outlet />
      </main>
      <Footer />
      <TickerTape />
      {/* 챗봇 버튼은 MainPage 레이아웃에 포함됨 */}
      <ChatbotButton />
    </div>
  );
};

export default MainPage;
