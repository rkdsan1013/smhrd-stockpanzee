// /backend/src/ai/gptNewsAnalysis.ts
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export interface AnalysisResult {
  summary: string;
  brief_summary: string;
  title_ko: string;
  news_sentiment: number;
  news_positive: string[];
  news_negative: string[];
  tags: string[];
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

interface ChatCompletionResponse {
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

export async function analyzeNews(
  newsTitle: string,
  newsContent: string,
  publishedDate: string,
): Promise<AnalysisResult> {
  const prompt = `뉴스 제목: ${newsTitle}
게시일: ${publishedDate}
뉴스 내용: ${newsContent}

아래 JSON 형식만 반환하십시오. 추가 설명이나 주석은 포함하지 마십시오.
형식:
{"summary": "...", "brief_summary": "...", "title_ko": "...", "news_sentiment": n, "news_positive": ["..."], "news_negative": ["..."], "tags": ["..."]}

- news_sentiment: 1 = 매우부정, 2 = 부정, 3 = 중립, 4 = 긍정, 5 = 매우긍정.
- tags: 종목 티커만 포함 (예: BTC, ETH, AAPL, TSLA, 005930, 000660, ...).
- summary: 뉴스의 전체 내용을 자세하게 요약하십시오. 반드시 한글로 번역하여 작성.
- brief_summary: 뉴스 내용의 핵심을 한 줄로 간결하게 요약하십시오.
- title_ko: 뉴스 제목의 한글 번역본.
`;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "당신은 뉴스 분석 전문가입니다. 반드시 오직 순수 JSON만 반환하십시오.",
    },
    { role: "user", content: prompt },
  ];

  console.log("====== 입력 메시지 ======");
  messages.forEach((msg, idx) => {
    console.log(`[${idx + 1}] [${msg.role.toUpperCase()}]: ${msg.content}`);
  });
  console.log("====== 입력 메시지 끝 ======");

  try {
    const response = await axios.post<ChatCompletionResponse>(
      CHAT_COMPLETIONS_URL,
      {
        model: "gpt-4.1-mini",
        messages: messages,
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
    const resultText = response.data.choices[0].message.content.trim();
    console.log("====== GPT API 원본 응답 ======");
    console.log(resultText);
    console.log("====== GPT API 원본 응답 끝 ======");

    let result: AnalysisResult;
    try {
      result = JSON.parse(resultText);
    } catch (parseError) {
      console.error("JSON 파싱 실패:", parseError);
      console.error("파싱에 실패한 응답 문자열:", resultText);
      throw parseError;
    }
    return result;
  } catch (error) {
    console.error("OpenAI GPT API 호출 실패", error);
    throw error;
  }
}
