// /backend/src/services/news/cryptoNewsService.ts
// /backend/src/services/news/cryptoNewsService.ts
import { mapCryptoNews } from "../../utils/news/cryptoNewsMapper";
import { analyzeNews } from "../../../src/ai/gptNewsAnalysis";
import { getRefinedNewsAnalysis } from "../../../src/ai/refinedNewsAnalysis";
import { embedAndStore } from "../../../src/ai/embeddingService";
import { createNewsWithAnalysis, findNewsByLink } from "../../../src/models/newsTransactions";
import { INews } from "../../../src/models/newsModel";
import { findCryptoAssets } from "../../../src/models/assetModel";

// AnalysisResult는 getRefinedNewsAnalysis()에서 반환하는 타입 (news_id 미포함)
interface AnalysisResult {
  news_sentiment: number;
  news_positive: any;
  news_negative: any;
  community_sentiment?: number;
  summary: string;
  brief_summary: string;
  tags: string | string[]; // 문자열(JSON) 또는 배열일 수 있음
}

const CRYPTO_NEWS_API_URL =
  process.env.CRYPTO_NEWS_API_URL || "https://min-api.cryptocompare.com/data/v2/news/?lang=EN";

export const fetchAndProcessNews = async (): Promise<void> => {
  try {
    console.log("뉴스 수집 시작:", CRYPTO_NEWS_API_URL);
    const response = await fetch(CRYPTO_NEWS_API_URL);
    if (!response.ok) {
      throw new Error(`뉴스 API 요청 실패: ${response.status}`);
    }
    const rawData = await response.json();
    const newsItems: INews[] = mapCryptoNews(rawData);
    console.log(`수집된 뉴스 전체 개수: ${newsItems.length}`);

    for (const news of newsItems) {
      console.log("---------------------------");
      console.log(`처리 시작: 뉴스 제목 - ${news.title}`);
      console.log("게시일:", news.published_at);
      console.log("뉴스 원문:");
      console.log(news.content);

      // 중복 뉴스 체크
      const exists = await findNewsByLink(news.news_link);
      if (exists) {
        console.log(`뉴스 링크 ${news.news_link} 이미 DB에 존재하므로 스킵합니다.`);
        continue;
      }

      // preparedNews: news_category를 "crypto"로 고정
      const preparedNews: INews = { ...news, news_category: "crypto" };

      const publishedDateStr =
        preparedNews.published_at instanceof Date
          ? preparedNews.published_at.toISOString()
          : preparedNews.published_at;

      // 1. 초기 GPT 분석 실행 (게시일 포함)
      const initialAnalysis = await analyzeNews(
        preparedNews.title,
        preparedNews.content,
        publishedDateStr,
      );
      console.log("초기 GPT 뉴스 분석 결과:", initialAnalysis);

      // 2. refined 분석 실행 (RAG 기반)
      // *** 주의: getRefinedNewsAnalysis 내부에서는 유사 뉴스 검색 임계값을 0.1로 사용하도록 수정했다고 가정합니다.
      const refinedAnalysis: AnalysisResult = await getRefinedNewsAnalysis(
        preparedNews.title,
        preparedNews.content,
        initialAnalysis,
      );
      console.log("최종(Refined) 뉴스 분석 결과:", refinedAnalysis);

      // 3. 태그 처리: refinedAnalysis.tags가 문자열인 경우 JSON 파싱, 배열이면 그대로 사용
      let tagsArray: string[] = [];
      if (Array.isArray(refinedAnalysis.tags)) {
        tagsArray = refinedAnalysis.tags;
      } else if (typeof refinedAnalysis.tags === "string") {
        try {
          tagsArray = JSON.parse(refinedAnalysis.tags);
        } catch (e) {
          tagsArray = [];
        }
      }

      // 4. Binance 시장 자산 조회 및 태그 필터링
      const cryptoAssets = await findCryptoAssets();
      const cryptoSymbols = new Set(cryptoAssets.map((asset) => asset.symbol.toUpperCase()));
      const filteredTags = tagsArray.filter((tag) => cryptoSymbols.has(tag.toUpperCase()));
      console.log("필터링된 태그:", filteredTags);

      // 5. DB 저장 로직 및 임베딩 저장 로직은 테스트를 위한 목적으로 생략하고, 진행 과정을 로그에 출력합니다.
      console.log("DB 저장 로직 생략 - 테스트 모드입니다.");
      console.log("임베딩 저장 로직 생략 - 테스트 모드입니다.");

      console.log("---------------------------");
    }
    console.log("모든 뉴스 처리 완료.");
  } catch (error: any) {
    console.error("뉴스 처리 중 오류 발생:", error);
    throw error;
  }
};
