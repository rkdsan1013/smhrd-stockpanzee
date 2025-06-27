// /backend/src/ai/gptNewsAnalysis.ts
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export interface AnalysisResult {
  success: boolean;
  summary?: string;
  brief_summary?: string;
  title_ko?: string;
  news_sentiment?: number;
  news_positive?: string[];
  news_negative?: string[];
  tags?: string[];
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

interface ChatMessage {
  role: "system" | "assistant" | "user";
  content: string;
}

interface ChatCompletionChoice {
  message: ChatMessage;
}
interface ChatCompletionResponse {
  choices: ChatCompletionChoice[];
}

export async function analyzeNews(
  newsTitle: string,
  newsContent: string,
  publishedDate: string,
): Promise<AnalysisResult> {
  const systemPrompt = `
당신은 금융 뉴스 분석 전문가입니다.
아래 지침을 절대 어기지 말고, 오직 순수 JSON만 반환하세요.

1) 이 기사가 '주식·증권시장' 관련 뉴스인지 판단:
   • 관련(기업공시·주가·시총·증권이슈·투자전략 등): KEEP  
   • 광고·홍보·이벤트·프로모션·혜택 안내·구매유도·일반생활정보 등: REJECT

2) REJECT 시 즉시:
{"success": false}

3) KEEP 시, 반드시 아래 형식으로만:
{
  "success": true,
  "summary": "...",
  "brief_summary": "...",
  "title_ko": "...",
  "news_sentiment": n,
  "news_positive": ["..."],
  "news_negative": ["..."],
  "tags": ["..."]
}

■ summary 작성 규칙:
- Who, What, When, Where, Why, How 의 핵심 사실 모두 포함  
- 해설·추측·추가 배경 금지  
- 정보 완결성 우선 (문장 수 제한 없음)  
- 반드시 한글로 작성

■ brief_summary 작성 규칙:
- summary를 더 압축해, 핵심 키워드+결과만 한 줄로 요약

■ 필드 정의:
- title_ko      : 뉴스 제목의 한글 번역  
- news_sentiment: 1=매우부정,2=부정,3=중립,4=긍정,5=매우긍정  
- tags          : 뉴스에 언급된 ‘종목 티커’만 포함 (예: BTC, ETH, AAPL, TSLA, 005930, 000660 ...)

---- 예시 1: 관련 뉴스 ----
입력:
  title: "삼성전자, 분기 실적 호조"
  content: "삼성전자가 2025년 2분기 매출 70조원, 영업이익 15조원을 기록하며 시장 예상치를 상회했습니다..."
반환:
{
  "success": true,
  "summary": "삼성전자는 2025년 2분기 매출 70조원, 영업이익 15조원을 기록하며 시장 예상치를 상회했습니다.",
  "brief_summary": "2분기 실적 컨센서스 상회",
  "title_ko": "삼성전자, 분기 실적 호조",
  "news_sentiment": 4,
  "news_positive": ["매출 70조원","영업이익 15조원"],
  "news_negative": [],
  "tags": ["005930"]
}

---- 예시 2: 광고성 뉴스 ----
입력:
  title: "이 달의 추천 건강 식품!"
  content: "지금 주문하시면 특별 할인 혜택을 드립니다..."
반환:
{"success": false}
`;

  const userPrompt = `
뉴스 제목: ${newsTitle}
게시일: ${publishedDate}
뉴스 내용:
${newsContent}

위 지침에 따라 JSON으로만 응답하십시오.
`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt.trim() },
    { role: "assistant", content: "분석 준비 완료." },
    { role: "user", content: userPrompt.trim() },
  ];

  // OpenAI API 호출
  let raw: string;
  try {
    const resp = await axios.post<ChatCompletionResponse>(
      CHAT_COMPLETIONS_URL,
      {
        model: "gpt-4.1-mini",
        messages,
        temperature: 0,
        max_tokens: 2000,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      },
    );
    raw = resp.data.choices[0].message.content.trim();
  } catch (err: any) {
    console.error("OpenAI GPT API 호출 실패:", err.message || err);
    throw err;
  }

  console.log("====== GPT 응답 원본 ======");
  console.log(raw);
  console.log("====== 응답 끝 ======");

  // JSON 파싱
  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(raw);
  } catch (e: any) {
    console.error("JSON 파싱 오류:", e, raw);
    throw e;
  }

  // 관련 없는 뉴스 바로 REJECT
  if (parsed.success === false) {
    return { success: false };
  }

  // 광고 키워드 필터
  const adPattern = /이벤트|혜택|프로모션|할인|무료/;
  if (parsed.summary && adPattern.test(parsed.summary)) {
    console.warn("광고성 뉴스 키워드 감지, REJECT 처리:", parsed.summary);
    return { success: false };
  }

  // 필수 필드 검증
  const { summary, brief_summary, title_ko, news_sentiment, news_positive, news_negative, tags } =
    parsed;

  if (
    typeof summary !== "string" ||
    typeof brief_summary !== "string" ||
    typeof title_ko !== "string" ||
    typeof news_sentiment !== "number" ||
    !Array.isArray(news_positive) ||
    !Array.isArray(news_negative) ||
    !Array.isArray(tags)
  ) {
    console.error("분석 결과 형식 오류:", parsed);
    throw new Error("분석 결과 형식이 올바르지 않습니다.");
  }

  // 최종 반환
  return {
    success: true,
    summary,
    brief_summary,
    title_ko,
    news_sentiment,
    news_positive,
    news_negative,
    tags,
  };
}
