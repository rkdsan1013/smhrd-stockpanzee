// /backend/src/services/news/cryptoNewsService.ts
import { mapCryptoNews } from "../../utils/news/cryptoNewsMapper";
import { analyzeNews } from "../../../src/ai/gptNewsAnalysis";
import { getRefinedNewsAnalysis } from "../../../src/ai/refinedNewsAnalysis";
import { embedAndStore } from "../../../src/ai/embeddingService";
import {
  findNewsByLink,
  createNews,
  createNewsAnalysis,
  updateNewsTitleKo,
} from "../../../src/models/newsTransactions";
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
        news_category: "crypto" as "crypto",
      };

      // DB에 뉴스 저장 → news_id 획득
      const newsId = await createNews(preparedNews);
      console.log(`뉴스 DB 저장 완료. ID: ${newsId}`);

      // 게시일이 Date 타입이면 ISO 문자열로 변환
      const publishedDateStr =
        news.published_at instanceof Date ? news.published_at.toISOString() : news.published_at;

      // 초기 GPT 분석 실행 (게시일 포함하여)
      const initialAnalysis = await analyzeNews(news.title, news.content, publishedDateStr);
      console.log("초기 GPT 뉴스 분석 결과:", initialAnalysis);

      // GPT 분석 결과로 받은 한글 번역 제목으로 news.title_ko 업데이트
      await updateNewsTitleKo(newsId, initialAnalysis.title_ko);
      console.log(`뉴스의 한글 번역 제목 업데이트 완료: ${initialAnalysis.title_ko}`);

      // 임베딩 생성 및 벡터 DB에 저장 (예: 한글 제목+요약)
      await embedAndStore(newsId, `${initialAnalysis.title_ko} ${initialAnalysis.summary}`, {
        title: initialAnalysis.title_ko,
        publishedAt: news.published_at,
      });

      // RAG 기반 refined 분석 실행 (게시일 정보가 없으므로 빈 문자열 전달)
      const refinedAnalysis = await getRefinedNewsAnalysis(
        news.title,
        news.content,
        initialAnalysis,
      );
      console.log("최종(Refined) 뉴스 분석 결과:", refinedAnalysis);

      // Binance 시장 자산만 조회하여 태그 필터링
      const cryptoAssets = await findCryptoAssets();
      const cryptoSymbols = new Set(cryptoAssets.map((asset) => asset.symbol.toUpperCase()));
      const filteredTags = refinedAnalysis.tags.filter((tag) =>
        cryptoSymbols.has(tag.toUpperCase()),
      );

      // 뉴스 분석 결과를 JSON 문자열로 변환하여 DB에 저장
      const analysisData = {
        news_id: newsId,
        news_sentiment: refinedAnalysis.news_sentiment,
        news_positive: JSON.stringify(refinedAnalysis.news_positive),
        news_negative: JSON.stringify(refinedAnalysis.news_negative),
        community_sentiment: undefined,
        summary: refinedAnalysis.summary,
        brief_summary: refinedAnalysis.brief_summary,
        tags: JSON.stringify(filteredTags),
      };
      await createNewsAnalysis(analysisData);
      console.log(`뉴스 분석 결과 DB 저장 완료. 뉴스 ID: ${newsId}`);
      console.log(`처리 완료: 한글 번역 제목 - ${refinedAnalysis.title_ko}`);
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
