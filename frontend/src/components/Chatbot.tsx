// /frontend/src/components/Chatbot.tsx
import React, { useState, useRef, useEffect, useContext } from "react";
import Icons from "./Icons";
import { getChatbotAnswer } from "../services/chatbotService";
import { AuthContext } from "../providers/AuthProvider";

type Message = {
  id: number;
  sender: "bot" | "user";
  text: string;
};

const Chatbot: React.FC = () => {
  const { user } = useContext(AuthContext);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState<Message[]>([
    { id: 1, sender: "bot", text: "안녕하세요! 무엇을 도와드릴까요?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef<number>(2);

  // 닫기 버튼 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        isChatOpen &&
        chatContainerRef.current &&
        !chatContainerRef.current.closest(".chatbot-wrapper")?.contains(e.target as Node)
      ) {
        setIsChatOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isChatOpen]);

  // 채팅창 열면 자동 포커스
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  // 대화 업데이트 시 스크롤
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [conversations]);

  const TypingIndicator = () => (
    <div className="flex items-center space-x-1">
      {["0s", "0.2s", "0.4s"].map((delay, i) => (
        <span
          key={i}
          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
          style={{ animationDelay: delay }}
        />
      ))}
    </div>
  );

  // 토글: 로그인 상관없이 열기/닫기
  const toggleChatbot = () => {
    setIsChatOpen((prev) => !prev);
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return; // 로그인 필요
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    const userMsg: Message = {
      id: nextIdRef.current++,
      sender: "user",
      text: message.trim(),
    };
    setConversations((prev) => [...prev, userMsg]);
    setMessage("");

    const botMsg: Message = {
      id: nextIdRef.current++,
      sender: "bot",
      text: "",
    };
    setConversations((prev) => [...prev, botMsg]);

    try {
      const { answer } = await getChatbotAnswer({ question: userMsg.text });
      setConversations((prev) => {
        const copy = [...prev];
        copy[copy.length - 1].text = answer;
        return copy;
      });
    } catch {
      setConversations((prev) => {
        const copy = [...prev];
        copy[copy.length - 1].text = "오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        return copy;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className={`chatbot-wrapper fixed bottom-28 right-8 w-[400px] max-h-[80vh]
          bg-white text-gray-800 shadow-2xl rounded-xl flex flex-col
          transition-all duration-300 ease-in-out ${
            isChatOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-4 pointer-events-none"
          }`}
      >
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">팬지봇</h3>
          <button onClick={() => setIsChatOpen(false)}>
            <Icons name="close" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3">
          {user ? (
            conversations.map((msg, idx) =>
              msg.sender === "bot" ? (
                <div key={msg.id} className="flex items-start space-x-2">
                  <img
                    src="/chatbot.svg"
                    alt="Chatbot"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="max-w-full p-3 text-sm bg-gray-100 text-gray-700 rounded-xl rounded-bl-none">
                    {idx === conversations.length - 1 && isLoading ? <TypingIndicator /> : msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-full p-3 text-sm bg-blue-600 text-white rounded-xl rounded-br-none">
                    {msg.text}
                  </div>
                </div>
              ),
            )
          ) : (
            <div className="p-4 text-center text-gray-500">
              로그인된 사용자만 이용할 수 있는 서비스입니다.
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200">
          {user ? (
            <form onSubmit={handleMessageSubmit} className="flex items-center">
              <input
                ref={inputRef}
                type="text"
                placeholder="메시지를 입력하세요..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 px-4 py-2 focus:outline-none border-0"
              />
              <button
                type="submit"
                disabled={!message.trim() || isLoading}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition ${
                  !message.trim() || isLoading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isLoading ? (
                  <Icons
                    name="spinner"
                    className="w-6 h-6 text-gray-200 animate-spin fill-blue-600"
                  />
                ) : (
                  <Icons name="paperPlane" className="w-6 h-6 rotate-90 text-white" />
                )}
              </button>
            </form>
          ) : (
            <div className="text-center text-sm text-gray-500">로그인이 필요합니다.</div>
          )}
        </div>
      </div>

      <button
        onClick={toggleChatbot}
        className="fixed bottom-8 right-8 p-3 bg-blue-600 rounded-full
          shadow-lg hover:bg-blue-700 transition-all duration-300 ease-in-out"
      >
        {isChatOpen ? (
          <Icons name="close" className="w-8 h-8 text-white" />
        ) : (
          <Icons name="userHeadset" className="w-8 h-8 text-white" />
        )}
      </button>
    </>
  );
};

export default Chatbot;
