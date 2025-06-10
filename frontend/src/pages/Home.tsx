// /frontend/src/pages/Home.tsx
import React, { useState } from "react";

interface NewsItem {
  id: number;
  stockName: string;
  priceChange: number;
  title: string;
  image: string;
  category: string;
}

const newsItems: NewsItem[] = [
  {
    id: 1,
    stockName: "삼성전자",
    priceChange: 2.45,
    title: "삼성전자, 신제품 발표로 주가 급등",
    image: "/panzee.webp",
    category: "국내",
  },
  {
    id: 2,
    stockName: "현대차",
    priceChange: -1.23,
    title: "현대차, 실적 부진에 주가 하락",
    image: "/panzee.webp",
    category: "국내",
  },
  {
    id: 3,
    stockName: "LG전자",
    priceChange: 0.85,
    title: "LG전자, 혁신 기술 선보여 주가 상승",
    image: "/panzee.webp",
    category: "해외",
  },
  {
    id: 4,
    stockName: "카카오",
    priceChange: -2.1,
    title: "카카오, 경쟁 심화로 주가 하락세",
    image: "/panzee.webp",
    category: "해외",
  },
  {
    id: 5,
    stockName: "비트코인",
    priceChange: 3.76,
    title: "비트코인 가격 상승, 암호시장 활황",
    image: "/panzee.webp",
    category: "암호화폐",
  },
  {
    id: 6,
    stockName: "이더리움",
    priceChange: -1.5,
    title: "이더리움, 시장 불안정 반영해 하락",
    image: "/panzee.webp",
    category: "암호화폐",
  },
];

const Home: React.FC = () => {
  // 뉴스 필터 탭 상태 (전체, 국내, 해외, 암호화폐)
  const [selectedNewsTab, setSelectedNewsTab] = useState("전체");

  // 선택 탭에 따라 뉴스 필터링 ("전체"인 경우 모든 뉴스)
  const filteredNews =
    selectedNewsTab === "전체"
      ? newsItems
      : newsItems.filter((item) => item.category === selectedNewsTab);

  // 필터된 뉴스 목록을 즐겨찾기/주요 뉴스로 절반씩 나눕니다.
  const half = Math.ceil(filteredNews.length / 2);
  const favoritesNews = filteredNews.slice(0, half);
  const majorNews = filteredNews.slice(half);

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      {/* 그리드: 모바일은 한 컬럼, 데스크탑은 12컬럼 그리드로 뉴스영역 9컬럼, 인디케이터 영역 3컬럼 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* 뉴스 영역 (왼쪽, 9/12) */}
        <div className="md:col-span-9 space-y-6">
          {/* 뉴스 필터 탭 (우상단에 위치) */}
          <div className="flex justify-end mb-4">
            <div className="flex bg-gray-800 p-1 rounded-full border border-gray-600 space-x-2">
              {["전체", "국내", "해외", "암호화폐"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedNewsTab(tab)}
                  className={`px-4 py-2 transition-colors duration-200 text-white rounded-full ${
                    selectedNewsTab === tab
                      ? "bg-white/30 text-blue-500"
                      : "bg-transparent hover:bg-white/30"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* 즐겨찾기 뉴스 섹션 */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">즐겨찾기 뉴스</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {favoritesNews.map((item) => (
                <div
                  key={item.id}
                  className="p-4 transition-colors duration-200 hover:bg-gray-800 rounded-md"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-40 object-cover rounded-md"
                  />
                  {/* 종목명과 상승/하강률을 한 요소로 표시 */}
                  <div className="mt-2">
                    <span
                      className={`text-sm font-semibold ${
                        item.priceChange >= 0 ? "text-red-500" : "text-blue-500"
                      }`}
                    >
                      {item.stockName}{" "}
                      {item.priceChange >= 0
                        ? `+${item.priceChange.toFixed(2)}%`
                        : `${item.priceChange.toFixed(2)}%`}
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-white">{item.title}</h3>
                </div>
              ))}
            </div>
          </div>

          {/* 주요 뉴스 섹션 */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">주요 뉴스</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {majorNews.map((item) => (
                <div
                  key={item.id}
                  className="p-4 transition-colors duration-200 hover:bg-gray-800 rounded-md"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-40 object-cover rounded-md"
                  />
                  <div className="mt-2">
                    <span
                      className={`text-sm font-semibold ${
                        item.priceChange >= 0 ? "text-red-500" : "text-blue-500"
                      }`}
                    >
                      {item.stockName}{" "}
                      {item.priceChange >= 0
                        ? `+${item.priceChange.toFixed(2)}%`
                        : `${item.priceChange.toFixed(2)}%`}
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-white">{item.title}</h3>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 인디케이터 영역 (오른쪽, 3/12) - 여백과 너비를 줄여 간결하게 */}
        <div className="md:col-span-3">
          <div className="bg-gray-800 p-4 rounded-md border border-gray-600">
            <h2 className="text-xl font-semibold text-white mb-4">인디케이터</h2>
            <p className="text-gray-300">이 영역은 인디케이터 정보를 보여주는 자리입니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
