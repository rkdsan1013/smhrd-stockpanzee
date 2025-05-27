import React from "react";

const News: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">뉴스 페이지</h1>
      <p>뉴스 페이지의 내용이 여기에 표시됩니다.</p>
      <div className="mt-6">
        {[...new Array(10)].map((_, i) => (
          <p key={i} className="mb-2">
            뉴스 항목 {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        ))}
      </div>
    </div>
  );
};

export default News;
