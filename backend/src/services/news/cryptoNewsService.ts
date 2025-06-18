// /backend/src/services/news/cryptoNewsService.ts
import { mapCryptoNews } from "../../utils/news/cryptoNewsMapper";
import { analyzeNews } from "../../../src/ai/gptNewsAnalysis";
import { getRefinedNewsAnalysis } from "../../../src/ai/refinedNewsAnalysis";
import { findNewsByLink, createNewsWithAnalysis } from "../../../src/models/newsTransactions";
import { INews } from "../../../src/models/newsModel";
import { findCryptoAssets } from "../../../src/models/assetModel";

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

    // 각 뉴스 항목에 대해 처리
    for (const news of newsItems) {
      console.log("---------------------------");
      console.log(`처리 시작: 뉴스 제목 - ${news.title}`);
      console.log("게시일:", news.published_at);
      console.log("뉴스 원문:");
      console.log(news.content);

      // 중복 뉴스 체크: DB에 동일 뉴스 링크가 있다면 스킵
      const exists = await findNewsByLink(news.news_link);
      if (exists) {
        console.log(`뉴스 링크 ${news.news_link} 이미 DB에 존재하므로 스킵합니다.`);
        continue;
      }

      // 누락된 필드 보완: news_category는 "crypto"로 고정 (publisher는 매퍼의 값을 그대로 사용)
      const preparedNews: INews = {
        ...news,
        news_category: "crypto",
      };

      // 게시일이 Date 타입이면 ISO 문자열로 변환
      const publishedDateStr =
        news.published_at instanceof Date ? news.published_at.toISOString() : news.published_at;

      // 1. 초기 GPT 분석 실행 (게시일 포함)
      const initialAnalysis = await analyzeNews(news.title, news.content, publishedDateStr);
      console.log("초기 GPT 뉴스 분석 결과:", initialAnalysis);

      // 2. RAG 기반 refined 분석 실행
      const refinedAnalysis = await getRefinedNewsAnalysis(
        news.title,
        news.content,
        initialAnalysis,
      );
      console.log("최종(Refined) 뉴스 분석 결과:", refinedAnalysis);

      // 3. Binance 시장 자산 조회 및 태그 필터링
      const cryptoAssets = await findCryptoAssets();
      const cryptoSymbols = new Set(cryptoAssets.map((asset) => asset.symbol.toUpperCase()));
      const filteredTags = refinedAnalysis.tags.filter((tag: string) =>
        cryptoSymbols.has(tag.toUpperCase()),
      );

      // 4. 뉴스 분석 데이터를 구성
      //    각 값은 interface NewsAnalysis에 맞게 JSON 문자열로 변환하여 저장합니다.
      const analysisData = {
        news_sentiment: refinedAnalysis.news_sentiment,
        news_positive: JSON.stringify(refinedAnalysis.news_positive),
        news_negative: JSON.stringify(refinedAnalysis.news_negative),
        // community_sentiment를 fallback(null) 없이 직접 할당하여 타입을 맞춥니다.
        community_sentiment: refinedAnalysis.community_sentiment,
        summary: refinedAnalysis.summary,
        brief_summary: refinedAnalysis.brief_summary,
        tags: JSON.stringify(filteredTags),
      };

      // 5. 뉴스 정보와 분석 데이터를 단일 트랜잭션으로 저장
      //    GPT 분석 결과로 받은 한글 번역 제목은 initialAnalysis.title_ko를 사용합니다.
      const newsId = await createNewsWithAnalysis(
        preparedNews,
        analysisData,
        initialAnalysis.title_ko,
      );
      console.log(`뉴스 DB 및 분석 결과 저장 완료. 뉴스 ID: ${newsId}`);
      console.log(`처리 완료: 한글 번역 제목 - ${initialAnalysis.title_ko}`);
      console.log(`상세 요약: ${refinedAnalysis.summary}`);
      console.log(`간결 요약: ${refinedAnalysis.brief_summary}`);
      console.log("---------------------------");
    }
    console.log("모든 뉴스 처리 완료.");
  } catch (error: any) {
    console.error("뉴스 처리 중 오류 발생:", error);
    throw error;
  }
};
