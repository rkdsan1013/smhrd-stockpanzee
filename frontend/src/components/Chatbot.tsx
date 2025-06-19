// /frontend/src/components/Chatbot.tsx
import React, { useState, useRef, useEffect } from "react";
import Icons from "./Icons";
import { getChatbotAnswer } from "../services/chatbotService";

type Message = {
  id: number;
  sender: "bot" | "user";
  text: string;
};

const Chatbot: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState(""); // 사용자가 입력한 메시지 상태
  const [conversations, setConversations] = useState<Message[]>([
    { id: 1, sender: "bot", text: "안녕하세요! 무엇을 도와드릴까요?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef<number>(2);

  // 타이핑 인디케이터 컴포넌트 (세 개의 점 애니메이션)
  const TypingIndicator = () => (
    <div className="flex items-center space-x-1">
      <span
        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: "0s" }}
      ></span>
      <span
        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></span>
      <span
        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: "0.4s" }}
      ></span>
    </div>
  );

  // 챗봇 창 토글
  const toggleChatbot = () => {
    setIsChatOpen((prev) => !prev);
  };

  // 챗봇 창이 열리면 입력창에 자동 포커스
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  // 대화 내용 업데이트 시 자동 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversations]);

  // 메시지 전송 및 팬지봇 응답 요청 처리
  const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() === "" || isLoading) return;

    setIsLoading(true);

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: nextIdRef.current++,
      sender: "user",
      text: message.trim(),
    };
    setConversations((prev) => [...prev, userMessage]);
    setMessage("");

    // 응답 대기 중인 봇 메시지 추가 (초기 상태는 빈 문자열로)
    const botMessage: Message = {
      id: nextIdRef.current++,
      sender: "bot",
      text: "",
    };
    setConversations((prev) => [...prev, botMessage]);

    try {
      // 서비스 함수를 호출하여 백엔드 팬지봇 응답 요청
      const response = await getChatbotAnswer({ question: userMessage.text });
      setConversations((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = { ...updated[lastIndex], text: response.answer };
        return updated;
      });
    } catch (error) {
      console.error("팬지봇 응답 가져오기 실패", error);
      setConversations((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          ...updated[lastIndex],
          text: "오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 팬지봇 대화창 */}
      <div
        className={`fixed bottom-28 right-8 w-[400px] max-h-[80vh] bg-white text-gray-800 shadow-2xl rounded-xl flex flex-col transition-all duration-300 ease-in-out ${
          isChatOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* 팬지봇 헤더 */}
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold">팬지봇</h3>
        </div>

        {/* 대화 내용 영역 */}
        <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3">
          {conversations.map((msg, index) =>
            msg.sender === "bot" ? (
              <div key={msg.id} className="flex items-start space-x-2">
                {/* 챗봇 프로필 이미지로 chatbot.svg 사용 */}
                <img
                  src="/chatbot.svg"
                  alt="Chatbot Profile"
                  className="w-8 h-8 object-cover rounded-full"
                />
                <div className="max-w-full p-3 text-sm bg-gray-100 text-gray-700 rounded-xl rounded-bl-none">
                  {/* 마지막 봇 메시지이면서 isLoading이면 타이핑 인디케이터 렌더링 */}
                  {index === conversations.length - 1 && isLoading ? <TypingIndicator /> : msg.text}
                </div>
              </div>
            ) : (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-full p-3 text-sm bg-blue-600 text-white rounded-xl rounded-br-none">
                  {msg.text}
                </div>
              </div>
            ),
          )}
        </div>

        {/* 메시지 입력 영역 */}
        <div className="px-4 py-3 border-t border-gray-200">
          <form onSubmit={handleMessageSubmit} className="flex">
            <input
              type="text"
              placeholder="메시지를 입력하세요..."
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              // 입력창은 항상 활성 상태
              className="flex-1 px-4 py-2 focus:outline-none border-0"
            />
            <button
              type="submit"
              disabled={message.trim() === "" || isLoading}
              className={`w-12 h-12 flex items-center justify-center rounded-full transition ${
                message.trim() === "" || isLoading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isLoading ? (
                // Icons 컴포넌트로 spinner 아이콘 호출 (Icon.tsx의 spinner 정의에 따라)
                <Icons
                  name="spinner"
                  className="w-6 h-6 text-gray-200 animate-spin fill-blue-600"
                />
              ) : (
                <Icons name="paperPlane" className="w-6 h-6 rotate-90 text-white" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 우하단에 고정된 팬지봇 토글 버튼 */}
      <button
        onClick={toggleChatbot}
        className="fixed bottom-8 right-8 p-4 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 ease-in-out focus:outline-none"
      >
        <div className="transition-all duration-300 ease-in-out">
          {isChatOpen ? (
            <Icons name="close" className="w-10 h-10 text-white" />
          ) : (
            <Icons name="userHeadset" className="w-10 h-10 text-white" />
          )}
        </div>
      </button>
    </>
  );
};

export default Chatbot;
