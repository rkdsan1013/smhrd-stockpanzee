// /backend/src/ai/refinedNewsAnalysis.ts
import { analyzeNews, AnalysisResult } from "./gptNewsAnalysis";
import { getEmbedding } from "./embeddingService";
import vectorDB from "./vectorDB";

export async function getRefinedNewsAnalysis(
  newsTitle: string,
  newsContent: string,
  initialAnalysis: AnalysisResult,
): Promise<AnalysisResult> {
  // 1. 새 뉴스의 임베딩 벡터 생성 (제목과 본문 결합)
  const combinedText = `${newsTitle} ${newsContent}`;
  const queryVector = await getEmbedding(combinedText);

  // 2. 벡터 DB에서 유사 뉴스 검색 (상위 2개)
  const similarItems = vectorDB.findSimilar(queryVector, 2, 0.75);

  // 3. 유사 뉴스들의 정보를 추출하여 컨텍스트 텍스트 구성
  const contextParts = similarItems
    .map((item, idx) => {
      return `유사 뉴스 ${idx + 1} - 제목: ${item.meta?.title || "제목 없음"}`;
    })
    .join("\n");

  // 4. 초기 분석 결과와 유사 뉴스 정보를 결합하여 최종 GPT 프롬프트 구성
  const prompt = `
기존 뉴스 초기 분석 결과:
제목 (한글 번역): ${initialAnalysis.title_ko}
상세 요약: ${initialAnalysis.summary}
간결 요약: ${initialAnalysis.brief_summary}
감정 점수: ${initialAnalysis.news_sentiment}
긍정적 요소: ${initialAnalysis.news_positive.join(", ")}
부정적 요소: ${initialAnalysis.news_negative.join(", ")}
태그: ${initialAnalysis.tags.join(", ")}

아래는 유사 뉴스의 정보입니다:
${contextParts}

위 정보를 종합하여, 새 뉴스의 최종 요약과 감정 판단 (긍정/부정 요소, 태그 포함)을 JSON 형식으로 반환하십시오.
형식:
{"summary": "...", "brief_summary": "...", "title_ko": "...", "news_sentiment": n, "news_positive": ["..."], "news_negative": ["..."], "tags": ["..."]}
`;

  console.log("====== 최종 분석 프롬프트 ======");
  console.log(prompt);
  console.log("====== 프롬프트 끝 ======");

  // 5. 최종 분석 요청: 게시일 정보가 없으므로 빈 문자열("")을 세 번째 인자로 전달합니다.
  const refinedAnalysis = await analyzeNews("최종 분석 요청", prompt, "");
  return refinedAnalysis;
}
