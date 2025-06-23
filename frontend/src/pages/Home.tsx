// /frontend/src/pages/Home.tsx
import React, { useState } from "react";

interface NewsItem {
  id: number;
  stockName: string;
  priceChange: number;
  title: string;
  image: string;
  category: "국내" | "해외" | "암호화폐";
  sentiment: "매우 부정" | "부정" | "중립" | "긍정" | "매우긍정";
  summary: string;
}

// 더미 데이터 삭제 – 뉴스 데이터는 이후 API 등으로 불러오게 구성합니다.
const newsItems: NewsItem[] = [];

// 투자 감성 배지: 감성에 따라 단순 색상으로 구분합니다.
const getSentimentBadgeStyles = (sentiment: NewsItem["sentiment"]) => {
  if (sentiment === "긍정" || sentiment === "매우긍정") return "bg-green-700 text-white";
  if (sentiment === "부정" || sentiment === "매우 부정") return "bg-red-700 text-white";
  return "bg-gray-700 text-white";
};

const Home: React.FC = () => {
  // 뉴스 필터 탭 상태 (전체, 국내, 해외, 암호화폐)
  const [selectedNewsTab, setSelectedNewsTab] = useState("전체");

  // 추후 API나 다른 방법으로 즐겨찾기 뉴스 데이터를 관리할 수 있도록 별도 상태로 구성
  const [favoritesNews, _setFavoritesNews] = useState<NewsItem[]>([]);

  // 탭 선택에 따라 뉴스 필터링 (전체면 모든 뉴스, 아니면 해당 카테고리)
  const filteredNews =
    selectedNewsTab === "전체"
      ? newsItems
      : newsItems.filter((item) => item.category === selectedNewsTab);

  // 즐겨찾기 뉴스에 포함되지 않은 나머지 뉴스를 주요 뉴스로 분리합니다.
  const majorNews = filteredNews.filter((news) => !favoritesNews.find((fav) => fav.id === news.id));

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      {/* 그리드: 좌측 뉴스 영역, 우측 AI 분석 및 통계 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 좌측 뉴스 영역 */}
        <div className="md:col-span-9 space-y-6">
          {/* 뉴스 필터 탭 */}
          <div className="flex justify-end">
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

          {/* 즐겨찾기 뉴스 영역: 즐겨찾기 뉴스가 있을 경우에만 렌더링 */}
          {favoritesNews.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">즐겨찾기 뉴스</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {favoritesNews.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 transition-colors duration-200 hover:bg-gray-800 rounded-md"
                  >
                    <div className="relative w-full aspect-video">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </div>
                    <div className="mt-2 flex space-x-2">
                      <span className="inline-block px-2 py-1 text-xs font-bold rounded-full bg-gray-700 text-white">
                        {item.category}
                      </span>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${getSentimentBadgeStyles(
                          item.sentiment,
                        )}`}
                      >
                        {item.sentiment}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span
                        className={`text-sm font-semibold ${
                          item.priceChange >= 0 ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {item.stockName}{" "}
                        {item.priceChange >= 0
                          ? `+${item.priceChange.toFixed(2)}%`
                          : `${item.priceChange.toFixed(2)}%`}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-400">{item.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 즐겨찾기 뉴스가 없을 경우 혹은 그 외의 모든 경우에 주요 뉴스 영역 렌더링 */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">주요 뉴스</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {majorNews.map((item) => (
                <div
                  key={item.id}
                  className="p-4 transition-colors duration-200 hover:bg-gray-800 rounded-md"
                >
                  <div className="relative w-full aspect-video">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                  <div className="mt-2 flex space-x-2">
                    <span className="inline-block px-2 py-1 text-xs font-bold rounded-full bg-gray-700 text-white">
                      {item.category}
                    </span>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-bold rounded-full ${getSentimentBadgeStyles(
                        item.sentiment,
                      )}`}
                    >
                      {item.sentiment}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`text-sm font-semibold ${
                        item.priceChange >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {item.stockName}{" "}
                      {item.priceChange >= 0
                        ? `+${item.priceChange.toFixed(2)}%`
                        : `${item.priceChange.toFixed(2)}%`}
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-400">{item.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 우측 AI 분석 & 통계 영역 */}
        <div className="md:col-span-3">
          <div className="bg-gray-800 p-4 rounded-md border border-gray-600">
            <h2 className="text-xl font-semibold text-white mb-4">AI 분석 & 통계</h2>
            <p className="text-gray-300 mb-2">
              최신 뉴스 데이터를 기반으로 투자 판단과 요약 정보를 제공합니다.
            </p>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li>전체 투자 감성: 중립</li>
              <li>최근 뉴스 요약: 시장은 안정세</li>
              <li>추천 투자 전략: 신중한 접근 권장</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;