import React from "react";

const Market: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">마켓 페이지</h1>
      <p>마켓 페이지의 내용이 여기에 표시됩니다.</p>
      <div className="mt-6">
        {[...new Array(10)].map((_, i) => (
          <p key={i} className="mb-2">
            마켓 데이터 {i + 1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>
        ))}
      </div>
    </div>
  );
};

export default Market;
