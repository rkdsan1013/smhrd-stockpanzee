// /backend/src/services/news/cryptoNewsService.ts

import { mapCryptoNews } from "../../utils/news/cryptoNewsMapper";
import { analyzeNews, AnalysisResult } from "../../ai/gptNewsAnalysis";
import { findNewsByLink, createNewsWithAnalysis } from "../../models/newsTransactions";
import { findCryptoAssets } from "../../models/assetModel";
import { getEmbedding } from "../../ai/embeddingService";
import { upsertNewsVector, NewsVector } from "./storeNewsVector";

const CRYPTO_NEWS_API_URL =
  process.env.CRYPTO_NEWS_API_URL || "https://min-api.cryptocompare.com/data/v2/news/?lang=EN";

/**
 * 암호화폐 뉴스 수집 → 분석 → 저장 → 임베딩
 */
export async function fetchAndProcessCryptoNews(): Promise<void> {
  console.log("암호화폐 뉴스 파이프라인 시작:", CRYPTO_NEWS_API_URL);

  try {
    const response = await fetch(CRYPTO_NEWS_API_URL);
    if (!response.ok) {
      throw new Error(`암호화폐 뉴스 API 요청 실패: ${response.status}`);
    }

    const rawData = await response.json();
    const newsItems = mapCryptoNews(rawData);
    console.log(`수집된 암호화폐 뉴스 개수: ${newsItems.length}`);

    for (const news of newsItems) {
      console.log("───────────────────────────");
      console.log(`처리 대상(암호화폐): ${news.title}`);
      console.log(`링크: ${news.news_link}`);
      console.log(`게시일: ${news.published_at}`);

      // 이미 처리된 뉴스인지 체크
      if (await findNewsByLink(news.news_link)) {
        console.log("이미 DB에 저장됨 → 스킵");
        continue;
      }

      const publishedDateStr =
        news.published_at instanceof Date ? news.published_at.toISOString() : news.published_at;

      // 1) LLM 분석
      const analysis: AnalysisResult = await analyzeNews(
        news.title,
        news.content,
        publishedDateStr,
      );

      // 2) 관련성(REJECT) 여부 판단
      if (!analysis.success) {
        console.log("❌ 비관련/광고성 뉴스 → 스킵");
        continue;
      }
      console.log("✅ LLM 분석 완료:", {
        sentiment: analysis.news_sentiment,
        tags: analysis.tags,
      });

      // 3) DB 저장용 데이터 준비
      const preparedNews = {
        ...news,
        news_category: "crypto" as const,
      };
      const positives = analysis.news_positive || [];
      const negatives = analysis.news_negative || [];
      const tagsList = analysis.tags || [];

      // 4) 종목 태그 필터링
      const cryptoAssets = await findCryptoAssets();
      const symbolSet = new Set(cryptoAssets.map((a) => a.symbol.toUpperCase()));
      const filteredTags = tagsList.filter((t) => symbolSet.has(t.toUpperCase()));

      // 5) 분석 결과 DB 저장
      const analysisData = {
        news_sentiment: analysis.news_sentiment!,
        news_positive: JSON.stringify(positives),
        news_negative: JSON.stringify(negatives),
        community_sentiment: 3,
        summary: analysis.summary!,
        brief_summary: analysis.brief_summary!,
        tags: JSON.stringify(filteredTags),
      };
      const newsId = await createNewsWithAnalysis(preparedNews, analysisData, analysis.title_ko!);
      console.log(`✅ DB 저장 완료 (ID=${newsId})`);

      // 6) 임베딩 생성 및 벡터 저장
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
      console.log("✅ 임베딩 & 벡터 저장 완료");
    }

    console.log("🎉 암호화폐 뉴스 파이프라인 완료");
  } catch (err: any) {
    console.error("❌ 암호화폐 뉴스 처리 중 오류:", err);
    throw err;
  }
}
