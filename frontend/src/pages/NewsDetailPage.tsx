import React from "react"; import { useParams } from "react-router-dom";

const NewsDetailPage: React.FC = () => { const { newsId } = useParams();

// TODO: 실제 API에서 뉴스 ID로 데이터 가져오기 // 지금은 목업 데이터 사용 
const mockData = { company: "제드코어", code: "006066", price: 204000, change: -7500, changeRate: -3.55, aiSummary: "Zedcor Inc.는 2025년 1분기 매출 1,150만 달러, 조정 EBITDA 410만 달러를 포함하여 기록적인 분기 실적을 보고했습니다.", aiPositive: [ "분기별 매출 1,150만 달러 및 조정 EBITDA 410만 달러로 역대 최고 실적", "계약 성사율이 90% 이상 유지", "생산량 100대 증산 계획", ], aiNegative: [ "수출 캐나다 하락으로 인해 1월 매출 감소", "환율 및 공급망 문제 지속", ], latestNews: [ "2025년 5월 15일 - 1분기 실적 컨퍼런스 콜 공지", "2025년 4월 19일 - 생산라인 확대 발표", "2025년 4월 11일 - AI 응용 제품 출하량 증가", ], };

return (
  <div className="max-w-6xl mx-auto px-4 py-8 text-white">
    {/* 상단 주식명 및 가격 */}
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-2">
        {mockData.company} ({mockData.code})
      </h1>
      <div className="flex items-center space-x-4">
        <span className="text-2xl">{mockData.price.toLocaleString()}원</span>
        <span
          className={`text-lg ${mockData.change > 0 ? 'text-red-400' : 'text-blue-400'}`}
        >
          {mockData.change > 0 ? '+' : ''}
          {mockData.change.toLocaleString()} ({mockData.changeRate}%)
        </span>
      </div>
    </div>
  </div>
);

{/* AI 요약 */}
  <div className="bg-gray-800 p-4 rounded mb-6">
    <h2 className="text-xl font-semibold mb-2">AI 요약</h2>
    <p>{mockData.aiSummary}</p>
  </div>

  {/* 긍정/부정 평가 */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div className="bg-green-900 p-4 rounded">
      <h3 className="text-lg font-semibold mb-2">긍정 평가</h3>
      <ul className="list-disc pl-5">
        {mockData.aiPositive.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
    <div className="bg-red-900 p-4 rounded">
      <h3 className="text-lg font-semibold mb-2">부정 평가</h3>
      <ul className="list-disc pl-5">
        {mockData.aiNegative.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  </div>

  {/* 최신 뉴스 */}
  <div className="bg-gray-800 p-4 rounded">
    <h3 className="text-lg font-semibold mb-2">ZDCAF 최신 뉴스</h3>
    <ul className="list-disc pl-5">
      {mockData.latestNews.map((news, idx) => (
        <li key={idx}>{news}</li>
      ))}
    </ul>
  </div>

};

export default NewsDetailPage;

