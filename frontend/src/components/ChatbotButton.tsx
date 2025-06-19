// /frontend/src/components/ChatbotButton.tsx
import React, { useState } from "react";

// 예시로 단순한 버튼을 만들고, 클릭 시 챗봇 창을 토글하는 형태로 구현합니다.
const ChatbotButton: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChatbot = () => {
    setIsChatOpen((prev) => !prev);
  };

  return (
    <>
      {/* 챗봇 콘텐츠 예시 (실제 구현 시에는 챗봇 컴포넌트를 분리하여 사용할 수 있음) */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-8 w-80 h-96 bg-white text-black shadow-lg rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">챗봇</h3>
            <button onClick={toggleChatbot} className="text-xl font-bold">
              &times;
            </button>
          </div>
          <div className="overflow-y-auto h-full">
            {/* 챗봇 내용 */}
            <p>여기에 챗봇 내용이 표시됩니다.</p>
          </div>
        </div>
      )}

      {/* 우하단에 고정된 챗봇 열기 버튼 */}
      <button
        onClick={toggleChatbot}
        className="fixed bottom-8 right-8 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        {/* 아이콘 대신 간단한 텍스트 또는 이모티콘 사용 */}
        💬
      </button>
    </>
  );
};

export default ChatbotButton;
