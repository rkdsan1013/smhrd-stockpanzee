import { mapCryptoNews } from "../../utils/news/cryptoNewsMapper";
import { analyzeNews } from "../../../src/ai/gptNewsAnalysis";
import { findNewsByLink, createNewsWithAnalysis } from "../../../src/models/newsTransactions";
import { findCryptoAssets } from "../../../src/models/assetModel";
import { getEmbedding } from "../../../src/ai/embeddingService";
import { upsertNewsVector, NewsVector } from "../../../src/services/news/storeNewsVector";

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
    const newsItems = mapCryptoNews(rawData);
    console.log(`수집된 뉴스 전체 개수: ${newsItems.length}`);

    for (const news of newsItems) {
      console.log("---------------------------");
      console.log(`처리 시작: 뉴스 제목 - ${news.title}`);
      console.log("게시일:", news.published_at);
      console.log("뉴스 원문:");
      console.log(news.content);

      const exists = await findNewsByLink(news.news_link);
      if (exists) {
        console.log(`뉴스 링크 ${news.news_link} 이미 DB에 존재하므로 스킵합니다.`);
        continue;
      }

      const preparedNews = {
        ...news,
        news_category: "crypto" as "crypto",
      };

      const publishedDateStr =
        news.published_at instanceof Date ? news.published_at.toISOString() : news.published_at;

      const analysisResult = await analyzeNews(news.title, news.content, publishedDateStr);
      console.log("GPT 뉴스 분석 결과:", analysisResult);

      const cryptoAssets = await findCryptoAssets();
      const cryptoSymbols = new Set(cryptoAssets.map((asset) => asset.symbol.toUpperCase()));
      const filteredTags = analysisResult.tags.filter((tag: string) =>
        cryptoSymbols.has(tag.toUpperCase()),
      );

      const analysisData = {
        news_sentiment: analysisResult.news_sentiment,
        news_positive: JSON.stringify(analysisResult.news_positive),
        news_negative: JSON.stringify(analysisResult.news_negative),
        community_sentiment: 3,
        summary: analysisResult.summary,
        brief_summary: analysisResult.brief_summary,
        tags: JSON.stringify(filteredTags),
      };

      const newsId = await createNewsWithAnalysis(
        preparedNews,
        analysisData,
        analysisResult.title_ko,
      );
      console.log(`뉴스 DB 및 분석 결과 저장 완료. 뉴스 ID: ${newsId}`);
      console.log(`처리 완료: 한글 번역 제목 - ${analysisResult.title_ko}`);
      console.log(`상세 요약: ${analysisResult.summary}`);
      console.log(`간결 요약: ${analysisResult.brief_summary}`);
      console.log("---------------------------");

      const newsVectorText = `${news.title} ${publishedDateStr} ${analysisResult.summary}`;
      const embeddingVector = await getEmbedding(newsVectorText);
      const newsVector: NewsVector = {
        id: news.news_link,
        values: embeddingVector,
        metadata: {
          published_at: publishedDateStr,
          title_ko: analysisResult.title_ko,
          summary: analysisResult.summary,
          news_link: news.news_link,
        },
      };
      await upsertNewsVector(newsVector);
      console.log("뉴스 임베딩 및 로컬 벡터 DB 저장 완료.");
    }
    console.log("모든 뉴스 처리 완료.");
  } catch (error: any) {
    console.error("뉴스 처리 중 오류 발생:", error);
    throw error;
  }
};
