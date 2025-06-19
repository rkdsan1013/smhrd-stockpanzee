// /backend/src/ai/gptChatbot.ts
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  choices: ChatCompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 팬지봇 응답을 생성하기 위해 GPT‑4.1‑mini 모델에 질문을 전달합니다.
 *
 * @param question 팬지봇에게 전달할 사용자 질문
 * @returns GPT API가 생성한 응답 텍스트
 */
export async function getChatbotResponse(question: string): Promise<string> {
  // 현재 날짜를 동적으로 생성 (예: "2025년 6월 19일")
  const today = new Date();
  const formattedDate = today.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 시스템 프롬프트:
  // 팬지봇은 금융 전문가로서 사용자 질문에 대해 핵심 정보만 간략하고 직설적으로 답변해야 합니다.
  // 오늘 날짜 정보는 "오늘 날짜: [현재 날짜]"로 제공하며,
  // 금융, 주식, 투자 관련 질문에 대해서만 답변을 제공하고, 그렇지 않은 경우는 "금융, 주식, 투자 관련 질문을 해주세요."라고 응답합니다.
  const systemPrompt =
    "당신은 팬지봇입니다. " +
    "당신은 금융 전문가로서 사용자 질문에 대해 핵심 정보만 간략하고 직설적으로 답변해야 합니다. " +
    "불필요한 추가 설명이나 부가적인 의견은 제공하지 마세요. " +
    "오늘 날짜: " +
    formattedDate +
    " " +
    "금융, 주식, 투자 관련 질문에 대해서만 답변을 제공하며, 만약 질문이 우리 서비스와 관련 없는 내용이라면 '금융, 주식, 투자 관련 질문을 해주세요.'라고 응답하세요.";

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: question },
  ];

  try {
    const response = await axios.post<ChatCompletionResponse>(
      CHAT_COMPLETIONS_URL,
      {
        model: "gpt-4.1-mini",
        messages,
        max_tokens: 2000,
        temperature: 0,
        n: 1,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      },
    );
    const answer = response.data.choices[0].message.content.trim();
    return answer;
  } catch (error) {
    console.error("GPT API 호출 실패", error);
    throw error;
  }
}
