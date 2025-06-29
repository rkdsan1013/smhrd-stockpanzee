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
  // 1) 시스템 프롬프트: 관련/비관련 판정, 필드 정의, 광고 예시, 출력 포맷, 6W1H 요약 & 엄격한 sentiment 가이드
  const systemPrompt = `
당신은 금융 뉴스 분석 전문가입니다.
아래 지침을 절대 어기지 말고, 오직 순수 JSON만 반환하세요.

1) 이 기사가 '주식·증권시장' 관련 뉴스인지 판단:
   • 관련(기업공시·주가·시총·증권이슈·투자전략 등): KEEP  
   • 광고·홍보·이벤트·프로모션·혜택 안내·구매유도·일반정보·모금·매진·상승 가능성·투자자 참여 과장 등: REJECT

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
- Who·What·When·Where·Why·How 핵심 사실 모두 포함  
- 해설·추측·추가 배경 절대 제외  
- 정보 완결성 우선, 문장 수 제한 없음  
- 반드시 한글로 작성

■ brief_summary 작성 규칙:
- summary를 더 압축해 핵심 키워드+결과만 한 줄로 요약

■ sentiment 평가 규칙 (절대 어기지 말 것):
- 본문이 “~ 좋습니다” 식 긍정적 문장이라 해도, 실제 시장·기업·투자자 관점에서
  실적, 가이드라인 변화, 주가·거래량 반응, 리스크 공시 등의 핵심 팩트를 기반으로만 판단  
- 감정적 수식어(“훌륭하다”, “최고다”, “축하한다”) 사용 금지  
- 아래 5단계 룰에 따라 엄격히 배점:
   1 = 중대한 리스크·손실 소식 (주가 급락, 대규모 소송·부도 우려 등)  
   2 = 부정적 이슈(경영진 경고, 실적 부진 등)로 시장 반응 약세 기대  
   3 = 중립(특이 동향 없음, 단순 정보 전달)  
   4 = 긍정적 이슈(실적 개선, 전략 발표 등)로 시장 반응 긍정 기대  
   5 = 매우 긍정(예상 뛰어넘는 실적, 대규모 전략 제휴·투자 유치 등으로 즉각적 시장 강한 반응 예상)  
- 반드시 본문에 언급된 구체적 수치·사실을 평가 근거로 제시

■ 필드 정의:
- title_ko      : 뉴스 제목 한글 번역  
- news_sentiment: 1=매우부정,2=부정,3=중립,4=긍정,5=매우긍정  
- tags          : 뉴스에 언급된 종목 티커만 (예: BTC, ETH, AAPL, TSLA, 005930, 000660 ...)

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

  // 2) 유저 프롬프트: 실제 뉴스 데이터
  const userPrompt = `
뉴스 제목: ${newsTitle}
게시일: ${publishedDate}
뉴스 내용:
${newsContent}

위 지침에 따라 JSON만 응답하십시오.
`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt.trim() },
    { role: "assistant", content: "분석 준비 완료." },
    { role: "user", content: userPrompt.trim() },
  ];

  // 3) OpenAI API 호출
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

  // 4) JSON 파싱
  let parsed: AnalysisResult;
  try {
    parsed = JSON.parse(raw);
  } catch (e: any) {
    console.error("JSON 파싱 오류:", e, raw);
    throw e;
  }

  // 5) success=false 즉시 반환
  if (parsed.success === false) {
    return { success: false };
  }

  // 6) 필수 필드 검증
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

  // 7) 최종 반환
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
