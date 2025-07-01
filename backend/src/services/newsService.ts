// backend/src/services/newsService.ts

import * as newsModel from "../models/newsModel";
import { getAllNews as getAllNewsRaw } from "../models/newsTransactions";
import * as assetModel from "../models/assetModel";

export interface NewsItem {
  id: number;
  title: string;
  title_ko?: string;
  image: string;
  category: "domestic" | "international" | "crypto";
  sentiment: number;
  summary: string;
  brief_summary: string;
  tags: string; // JSON 문자열
  published_at: string;
  publisher: string;
}

export interface NewsDetail {
  id: number;
  title_ko: string;
  news_category: string;
  thumbnail: string;
  news_link: string;
  publisher: string;
  published_at: string;
  summary: string;
  news_positive: string;
  news_negative: string;
  community_sentiment: string;
  news_sentiment: number;
  tags: string[]; // 파싱된 배열
  assets_symbol?: string;
  assets_market?: string;
  assets_name?: string;
}

/**
 * 뉴스 상세 조회 (ID)
 */
export async function getNewsDetailById(newsId: number): Promise<NewsDetail | null> {
  // DB에서 news + analysis + asset join
  const raw = await newsModel.findNewsWithAnalysisById(newsId);
  if (!raw) return null;

  // raw.tags는 문자열(JSON) 또는 배열
  let tagsArr: string[] = [];
  if (typeof raw.tags === "string") {
    try {
      const parsed = JSON.parse(raw.tags);
      if (Array.isArray(parsed)) tagsArr = parsed;
    } catch {}
  } else if (Array.isArray(raw.tags)) {
    tagsArr = raw.tags;
  }

  // ⭐⭐⭐ 국내 뉴스면 종목명으로 변환
  if (
    (raw.news_category === "domestic" || raw.category === "domestic") &&
    Array.isArray(tagsArr) &&
    tagsArr.length > 0
  ) {
    const assetNames = await assetModel.getAssetNamesBySymbols(tagsArr);
    tagsArr = tagsArr.map((code) => assetNames[code] || code);
  }

  return {
    ...raw,
    tags: tagsArr,
    community_sentiment: String(raw.community_sentiment ?? ""),
    assets_symbol: raw.assets_symbol ?? undefined,
    assets_market: raw.assets_market ?? undefined,
    assets_name: raw.assets_name ?? undefined,
  };
}


/**
 * 종목(Symbol) 기반으로 매칭된 최신 뉴스 목록 조회 (현재 ID 제외)
 */
// getAllNews 내부: 뉴스 전체 목록 반환할 때 국내만 변환
// 기존 함수 이름은 getAllNews 그대로 둬도 됨.
export async function getAllNews(): Promise<NewsItem[]> {
  const list = await getAllNewsRaw();

  // ① 국내 뉴스에서 등장한 모든 종목코드 한 번에 모으기
  const allDomesticCodes = new Set<string>();
  for (const item of list) {
    // tags가 string이면 먼저 파싱
    if (typeof item.tags === "string") {
      try { item.tags = JSON.parse(item.tags); } catch {}
    }
    if (item.category === "domestic" && Array.isArray(item.tags)) {
      item.tags.forEach((code: string) => {
        // 코드 형태인 태그만 모으기 (숫자문자열인 경우)
        if (/^\d+$/.test(code)) allDomesticCodes.add(code);
      });
    }
  }

  // ② 한 번만 쿼리로 종목명 맵핑 가져오기
  let assetNames: Record<string, string> = {};
  if (allDomesticCodes.size > 0) {
    assetNames = await assetModel.getAssetNamesBySymbols(Array.from(allDomesticCodes));
  }

  // ③ 각 뉴스의 태그를 변환
  for (const item of list) {
    if (item.category === "domestic" && Array.isArray(item.tags)) {
      item.tags = item.tags.map((code: string) =>
        assetNames[code] ? assetNames[code] : code
      );
    }
  }
  return list;
}



// 이미 아래와 같이 되어 있다면 그대로 두면 됩니다!
export async function getNewsByAsset(assetSymbol: string, excludeId?: number): Promise<NewsItem[]> {
  const list = await newsModel.findNewsByAsset(assetSymbol, excludeId);

  for (const item of list) {
    // ⭐⭐⭐ 국내(category/news_category === "domestic")만 한글 변환
    if (
      (item.category === "domestic" || item.news_category === "domestic")
      && Array.isArray(item.tags)
      && item.tags.length > 0
    ) {
      // 혹시 tags가 string이면 파싱
      if (typeof item.tags[0] === "string" && !isNaN(Number(item.tags[0]))) {
        // 숫자(코드) 배열인 경우만!
        const assetNames = await assetModel.getAssetNamesBySymbols(item.tags);
        item.tags = item.tags.map((code: string) => assetNames[code] || code);
      }
    }
  }
  return list.map((item) => ({
    ...item,
    sentiment: item.news_sentiment ?? item.sentiment,
    tags: Array.isArray(item.tags) ? JSON.stringify(item.tags) : item.tags,
  }));
}

