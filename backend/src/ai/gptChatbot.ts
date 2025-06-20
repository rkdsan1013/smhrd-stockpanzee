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

/*──────────────────────────────────────────────────────────*/

export async function getChatbotResponse(prompt: string): Promise<string> {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  /*― system prompt 강화 ―*/
  const systemPrompt =
    `당신은 팬지봇입니다.\n` +
    `역할: 국내외 금융·주식·투자 정보를 간결하고 직설적으로 제공하는 전문가.\n` +
    `오늘 날짜: ${today}\n\n` +
    `규칙:\n` +
    `1) 질문이 금융·주식·투자·경제·암호화폐 등과 분명히 관련 있으면 반드시 답합니다.\n` +
    `2) 관련성이 매우 낮으면 “금융, 주식, 투자 관련 질문을 해주세요.”라고만 답합니다.\n` +
    `3) 필요 이상의 장황한 설명은 넣지 않고 핵심만 전달합니다.\n` +
    `4) 확실하지 않은 정보는 추측하지 말고 “자료가 부족합니다.”라고 답합니다.\n` +
    `5) RAG 컨텍스트에 문자열 “(관련 컨텍스트 없음)”이 포함될 경우, 질문 주제와 무관하게 **반드시** “자료가 부족합니다.” 한 문장만 출력합니다.\n`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt },
  ];

  try {
    const res = await axios.post<ChatCompletionResponse>(
      CHAT_COMPLETIONS_URL,
      {
        model: "gpt-4.1-mini",
        messages,
        max_tokens: 1500,
        temperature: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      },
    );
    return res.data.choices[0].message.content.trim();
  } catch (err) {
    console.error("GPT API 호출 실패", err);
    throw err;
  }
}
