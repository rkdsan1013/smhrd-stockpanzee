// /backend/src/ai/gptNewsAnalysis.ts
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export interface AnalysisResult {
  summary: string;
  sentiment: number; // 1(매우부정) ~ 5(매우긍정)
  tags: string[];
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

// ChatCompletion 관련 인터페이스 정의
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

export async function analyzeNews(newsContent: string): Promise<AnalysisResult> {
  // 프롬프트 구성 (오직 순수 JSON만 반환하도록 명시)
  const prompt = `뉴스 내용: ${newsContent}

아래 JSON 형식만 반환하십시오. 추가 설명이나 주석은 포함하지 마십시오.
형식:
{"summary": "...", "sentiment": n, "tags": ["tag1", "tag2", ...]}
`;

  // 메시지 배열 구성 - system 메시지로 역할과 지시를 명시하고, user 메시지에 프롬프트 전송
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: "당신은 뉴스 분석 전문가입니다. 반드시 오직 순수 JSON만 반환하십시오.",
    },
    { role: "user", content: prompt },
  ];

  try {
    const response = await axios.post<ChatCompletionResponse>(
      CHAT_COMPLETIONS_URL,
      {
        // 최신 gpt-4.1-mini 모델 사용 (모델 식별자는 필요 시 OpenAI 대시보드에서 확인)
        model: "gpt-4.1-mini",
        messages: messages,
        max_tokens: 250, // 충분한 토큰 수를 할당하여 JSON이 잘리지 않도록 함
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

    // 응답 메시지에서 content 추출 후 JSON 파싱 진행
    const resultText = response.data.choices[0].message.content.trim();
    console.log("GPT API 원본 응답:", resultText);

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
