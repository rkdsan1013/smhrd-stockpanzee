// /backend/src/services/news/cryptoNewsService.ts
import { mapCryptoNews } from "../../utils/news/cryptoNewsMapper";
import { analyzeNews } from "../../../src/ai/gptNewsAnalysis"; // 경로는 단계에 맞게 조정
const CRYPTO_NEWS_API_URL =
  process.env.CRYPTO_NEWS_API_URL || "https://min-api.cryptocompare.com/data/v2/news/?lang=EN";

export const fetchAndProcessOneNews = async (): Promise<void> => {
  try {
    console.log("뉴스 수집 시작:", CRYPTO_NEWS_API_URL);
    const response = await fetch(CRYPTO_NEWS_API_URL);
    if (!response.ok) {
      throw new Error(`뉴스 API 요청 실패: ${response.status}`);
    }
    const rawData = await response.json();
    const newsItems = mapCryptoNews(rawData);
    console.log(`수집된 뉴스 전체 개수: ${newsItems.length}`);

    // 테스트 목적으로 첫 번째 뉴스만 처리
    const testNewsItems = newsItems.slice(0, 1);
    console.log(`테스트로 처리할 뉴스 개수: ${testNewsItems.length}`);

    for (const news of testNewsItems) {
      console.log(`---------------------------`);
      console.log(`처리 시작: 뉴스 제목 - ${news.title}`);
      console.log("게시일:", news.published_at);
      console.log("뉴스 원문:");
      console.log(news.content);
      console.log("GPT를 통한 뉴스 분석 시작...");

      // analyzeNews 함수는 뉴스 제목과 내용을 기반으로
      // 상세 요약(summary), 간결 요약(brief_summary), 감정 및 태그 관련 정보를 반환합니다.
      const analysis = await analyzeNews(news.title, news.content);

      console.log("GPT 뉴스 분석 결과:", analysis);
      console.log(`처리 완료: 상세 요약 - ${analysis.summary}`);
      console.log(`간결 요약: ${analysis.brief_summary}`);
      console.log(`---------------------------`);
    }
    console.log("모든 테스트 뉴스 처리 완료.");
  } catch (error) {
    console.error("뉴스 처리 중 오류 발생:", error);
    throw error;
  }
};
