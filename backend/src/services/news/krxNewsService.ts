// /backend/src/services/news/krxNewsService.ts
import axios from "axios";
import cron from "node-cron";
import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";

import { extractFullContent } from "../../utils/news/newsContentExtractor";
import { mapKrxNews, INews, NaverNewsApiItem } from "../../utils/news/krxNewsMapper";
import { findAllAssets } from "../../models/assetModel";
import { findNewsByLink, createNewsWithAnalysis } from "../../models/newsTransactions";
import { analyzeNews, AnalysisResult } from "../../ai/gptNewsAnalysis";
import { getEmbedding } from "../../ai/embeddingService";
import { upsertNewsVector, NewsVector } from "./storeNewsVector";

const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const NAVER_API_URL = "https://openapi.naver.com/v1/search/news.json";

// 이미 처리한 링크를 기억
let collectedLinks = new Set<string>();

// 1) 썸네일 수집 (cheerio + OG 태그)
async function getThumbnail(url: string): Promise<string | null> {
  try {
    const res = await axios.get<string>(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(res.data);
    return $("meta[property='og:image']").attr("content") || null;
  } catch {
    return null;
  }
}

// 2) 본문·제목 추출: extractFullContent() + JSDOM
async function getArticleTitleAndContent(url: string): Promise<{ title: string; content: string }> {
  const content = (await extractFullContent(url)) || "";

  let title = "";
  try {
    const html = await axios
      .get<string>(url, { headers: { "User-Agent": "Mozilla/5.0" } })
      .then((r) => r.data);
    const dom = new JSDOM(html);
    title = dom.window.document.querySelector("title")?.textContent?.trim() || "";
  } catch {
    title = "";
  }

  return { title, content };
}

/**
 * 3) 국내 뉴스 처리 (success 플래그 적용)
 */
export async function fetchAndProcessSmartKrxNews(): Promise<void> {
  console.log("📢 국내 뉴스 파이프라인 시작");

  try {
    // 3-1) NAVER 뉴스 API 호출
    const resp = await axios.get<{ items: NaverNewsApiItem[] }>(NAVER_API_URL, {
      params: { query: "주식", display: 20, sort: "date" },
      headers: {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
      },
    });
    const rawItems = resp.data.items;

    // 3-2) 중복 링크 제거
    const newItems = rawItems.filter((it) => !collectedLinks.has(it.link));
    newItems.forEach((it) => collectedLinks.add(it.link));

    // 3-3) 본문 크롤링 + 썸네일 동시 처리
    const [thumbnails, crawled] = await Promise.all([
      Promise.all(newItems.map((it) => getThumbnail(it.link))),
      Promise.all(newItems.map((it) => getArticleTitleAndContent(it.link))),
    ]);
    const titles = crawled.map((c) => c.title);
    const contents = crawled.map((c) => c.content);

    // 3-4) mapper 호출
    let newsItems: INews[] = mapKrxNews(newItems, thumbnails, contents, titles, crawled).filter(
      (n) => n.content.trim().length > 0,
    );
    console.log(`▶️ 처리 대상 뉴스: ${newsItems.length}건`);

    // 3-5) 자산 심볼 집합 생성
    const allAssets = await findAllAssets();
    const domAssets = allAssets.filter((a) => a.market === "KOSPI" || a.market === "KOSDAQ");
    const symbolSet = new Set(domAssets.map((a) => a.symbol.toUpperCase()));

    // 3-6) 뉴스별 파이프라인
    for (const news of newsItems) {
      if (await findNewsByLink(news.news_link)) {
        console.log(`이미 처리됨, 스킵: ${news.news_link}`);
        continue;
      }

      const publishedAt =
        news.published_at instanceof Date ? news.published_at.toISOString() : news.published_at;

      // GPT 분석
      const analysis: AnalysisResult = await analyzeNews(news.title, news.content, publishedAt);

      // success 플래그 검사
      if (!analysis.success) {
        console.log("❌ 관련 없는 뉴스(또는 광고)로 판단되어 스킵");
        continue;
      }
      console.log("🔍 GPT 분석:", {
        sentiment: analysis.news_sentiment,
        tags: analysis.tags,
      });

      // 태그·긍부정 기본값
      const positives = analysis.news_positive || [];
      const negatives = analysis.news_negative || [];
      const tagsList = analysis.tags || [];

      // 3-6-2) 국내 자산 심볼만 필터링
      const filteredTags = tagsList.filter((t) => symbolSet.has(t.toUpperCase()));
      if (filteredTags.length === 0) {
        console.log("연관 종목 없음, 스킵");
        continue;
      }

      // 3-6-3) DB에 뉴스 + 분석 결과 저장
      const preparedNews: INews = {
        ...news,
        news_category: "domestic",
      };
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

      // 3-6-4) 임베딩 → 벡터 스토어 업데이트
      const vectorText = `${news.title} ${publishedAt} ${analysis.summary}`;
      const values = await getEmbedding(vectorText);
      const nv: NewsVector = {
        id: news.news_link,
        values,
        metadata: {
          published_at: publishedAt,
          title_ko: analysis.title_ko!,
          summary: analysis.summary!,
          news_link: news.news_link,
        },
      };
      await upsertNewsVector(nv);
      console.log("✅ 벡터 저장 완료");
    }

    console.log("🎉 국내 뉴스 파이프라인 완료");
  } catch (err: any) {
    console.error("❌ 국내 뉴스 처리 오류:", err);
    throw err;
  }
}

/** 4) 매시 정각 스케줄러 */
export function startSmartKrxNewsScheduler(): void {
  cron.schedule("0 * * * *", () => {
    console.log("⏰ 국내 뉴스 스케줄러 실행");
    fetchAndProcessSmartKrxNews().catch((err) => console.error("스케줄러 실행 오류:", err));
  });
}
