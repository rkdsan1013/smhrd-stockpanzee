// /backend/src/services/news/cryptoNewsService.ts
import { mapCryptoNews } from "../../utils/news/cryptoNewsMapper";
import { analyzeNews, AnalysisResult } from "../../ai/gptNewsAnalysis";
import { findNewsByLink, createNewsWithAnalysis } from "../../models/newsTransactions";
import { findCryptoAssets } from "../../models/assetModel";
import { getEmbedding } from "../../ai/embeddingService";
import { upsertNewsVector, NewsVector } from "./storeNewsVector";

const CRYPTO_NEWS_API_URL =
  process.env.CRYPTO_NEWS_API_URL || "https://min-api.cryptocompare.com/data/v2/news/?lang=EN";

export const fetchAndProcessNews = async (): Promise<void> => {
  console.log("뉴스 수집 시작:", CRYPTO_NEWS_API_URL);

  try {
    const response = await fetch(CRYPTO_NEWS_API_URL);
    if (!response.ok) {
      throw new Error(`뉴스 API 요청 실패: ${response.status}`);
    }

    const rawData = await response.json();
    const newsItems = mapCryptoNews(rawData);
    console.log(`수집된 뉴스 전체 개수: ${newsItems.length}`);

    for (const news of newsItems) {
      console.log("───────────────────────────");
      console.log(`처리 시작: ${news.title}`);
      console.log(`링크: ${news.news_link}`);
      console.log(`게시일: ${news.published_at}`);
      console.log(news.content);

      // 이미 DB에 저장된 뉴스인지 체크
      if (await findNewsByLink(news.news_link)) {
        console.log("이미 처리됨, 스킵");
        continue;
      }

      // 게시일 포맷 통일
      const publishedDateStr =
        news.published_at instanceof Date ? news.published_at.toISOString() : news.published_at;

      // 1) GPT 분석
      const analysis: AnalysisResult = await analyzeNews(
        news.title,
        news.content,
        publishedDateStr,
      );

      // 2) success 플래그 확인
      if (!analysis.success) {
        console.log("❌ 관련 없는 뉴스(또는 광고)로 판단되어 스킵");
        continue;
      }
      console.log("✅ GPT 분석 완료:", {
        sentiment: analysis.news_sentiment,
        tags: analysis.tags,
      });

      // 3) DB 저장 준비
      const preparedNews = {
        ...news,
        news_category: "crypto" as const,
      };

      // 4) 태그·긍·부정 배열 기본값 처리
      const positives = analysis.news_positive || [];
      const negatives = analysis.news_negative || [];
      const tags = analysis.tags || [];

      // 5) 암호화폐 심볼 필터링
      const cryptoAssets = await findCryptoAssets();
      const symbolSet = new Set(cryptoAssets.map((asset) => asset.symbol.toUpperCase()));
      const filteredTags = tags.filter((t) => symbolSet.has(t.toUpperCase()));

      // 6) 분석 데이터 준비
      const analysisData = {
        news_sentiment: analysis.news_sentiment!,
        news_positive: JSON.stringify(positives),
        news_negative: JSON.stringify(negatives),
        community_sentiment: 3,
        summary: analysis.summary!,
        brief_summary: analysis.brief_summary!,
        tags: JSON.stringify(filteredTags),
      };

      // 7) DB 저장
      const newsId = await createNewsWithAnalysis(preparedNews, analysisData, analysis.title_ko!);
      console.log(`DB 저장 완료 (ID=${newsId})`);

      // 8) 임베딩 + 벡터 저장
      const vectorText = `${news.title} ${publishedDateStr} ${analysis.summary}`;
      const values = await getEmbedding(vectorText);
      const nv: NewsVector = {
        id: news.news_link,
        values,
        metadata: {
          published_at: publishedDateStr,
          title_ko: analysis.title_ko!,
          summary: analysis.summary!,
          news_link: news.news_link,
        },
      };
      await upsertNewsVector(nv);
      console.log("벡터 저장 완료");
    }

    console.log("모든 뉴스 처리 완료");
  } catch (err: any) {
    console.error("뉴스 처리 중 오류 발생:", err);
    throw err;
  }
};
