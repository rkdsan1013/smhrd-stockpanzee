import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Home from "./Home";
import News from "./News";
import Market from "./Market";
import Community from "./Community";

const MainPage: React.FC = () => {
  // activeMenu 내부 값은 영어 키로 설정
  const [activeMenu, setActiveMenu] = useState("home");

  let content;
  if (activeMenu === "home") content = <Home />;
  else if (activeMenu === "news") content = <News />;
  else if (activeMenu === "market") content = <Market />;
  else if (activeMenu === "community") content = <Community />;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
      <main className="pt-20 container mx-auto flex-grow">{content}</main>
      <Footer />
    </div>
  );
};

export default MainPage;
