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

const newsItems: NewsItem[] = [
  {
    id: 1,
    stockName: "삼성전자",
    priceChange: 2.45,
    title: "삼성전자, 신제품 발표로 주가 급등",
    image: "/panzee.webp",
    category: "국내",
    sentiment: "긍정",
    summary: "AI 요약: 삼성전자가 신제품 발표를 통해 투자자들의 기대감을 높였습니다.",
  },
  {
    id: 2,
    stockName: "현대차",
    priceChange: -1.23,
    title: "현대차, 실적 부진에 주가 하락",
    image: "/panzee.webp",
    category: "국내",
    sentiment: "부정",
    summary: "AI 요약: 현대차의 최근 실적 부진으로 인해 주가가 하락하고 있습니다.",
  },
  {
    id: 3,
    stockName: "LG전자",
    priceChange: 0.85,
    title: "LG전자, 혁신 기술 선보여 주가 상승",
    image: "/panzee.webp",
    category: "해외",
    sentiment: "중립",
    summary: "AI 요약: LG전자가 혁신 기술을 공개했으나, 시장 반응은 중립적입니다.",
  },
  {
    id: 4,
    stockName: "카카오",
    priceChange: -2.1,
    title: "카카오, 경쟁 심화로 주가 하락세",
    image: "/panzee.webp",
    category: "해외",
    sentiment: "매우 부정",
    summary: "AI 요약: 카카오의 주가가 경쟁 심화로 인해 크게 하락하고 있습니다.",
  },
  {
    id: 5,
    stockName: "비트코인",
    priceChange: 3.76,
    title: "비트코인 가격 상승, 암호시장 활황",
    image: "/panzee.webp",
    category: "암호화폐",
    sentiment: "매우긍정",
    summary: "AI 요약: 비트코인의 강력한 상승세가 암호화폐 시장에 긍정적인 신호로 작용 중입니다.",
  },
  {
    id: 6,
    stockName: "이더리움",
    priceChange: -1.5,
    title: "이더리움, 시장 불안정 반영해 하락",
    image: "/panzee.webp",
    category: "암호화폐",
    sentiment: "부정",
    summary: "AI 요약: 이더리움은 최근 시장 불안정성으로 인해 주가가 하락하고 있습니다.",
  },
];

const getSentimentBadgeStyles = (sentiment: NewsItem["sentiment"]) => {
  if (sentiment === "긍정" || sentiment === "매우긍정") return "bg-green-700 text-white";
  if (sentiment === "부정" || sentiment === "매우 부정") return "bg-red-700 text-white";
  return "bg-gray-700 text-white";
};

const News: React.FC = () => {
  const [selectedNewsTab, setSelectedNewsTab] = useState("전체");

  const filteredNews =
    selectedNewsTab === "전체"
      ? newsItems
      : newsItems.filter((item) => item.category === selectedNewsTab);

  return (
    <div className="p-6 bg-gray-900 min-h-screen">
      {/* 뉴스 필터 탭 */}
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

      {/* 뉴스 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredNews.map((item) => (
          <div
            key={item.id}
            className="p-4 transition-colors duration-200 hover:bg-gray-800 rounded-md"
          >
            {/* 이미지 영역 (16:9 비율) */}
            <div className="relative w-full aspect-video">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover rounded-md"
              />
            </div>
            {/* 통합 정보 행: 시장 및 감성 배지 */}
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
            {/* 종목명 및 주가 변화 */}
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
            {/* 뉴스 제목 및 AI 요약 */}
            <h3 className="mt-1 text-base font-bold text-white">{item.title}</h3>
            <p className="mt-1 text-sm text-gray-400">{item.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default News;
