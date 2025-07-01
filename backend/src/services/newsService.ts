import * as newsModel from "../models/newsModel";
import { getAllNews as getAllNewsRaw } from "../models/newsTransactions";
import * as assetModel from "../models/assetModel";

// NewsItem, NewsDetail은 tags를 객체 배열로 맞춰야 함!
export interface NewsTag {
  symbol: string;   // 종목코드 or 영문심볼 or 기타 한글명
  name: string;     // 한글명 or 영문심볼
}
export interface NewsItem {
  id: number;
  title: string;
  title_ko?: string;
  image: string;
  category: "domestic" | "international" | "crypto";
  sentiment: number;
  summary: string;
  brief_summary: string;
  tags: NewsTag[]; // ← 객체배열!
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
  tags: NewsTag[]; // ← 객체배열!
  assets_symbol?: string;
  assets_market?: string;
  assets_name?: string;
}

// ---------- 유틸 함수 ----------
function parseTags(rawTags: string | string[]): string[] {
  if (Array.isArray(rawTags)) return rawTags;
  if (typeof rawTags === "string") {
    try {
      const parsed = JSON.parse(rawTags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ---------- 뉴스 상세 조회 ----------
export async function getNewsDetailById(newsId: number): Promise<NewsDetail | null> {
  const raw = await newsModel.findNewsWithAnalysisById(newsId);
  if (!raw) return null;

  let tagsArr: string[] = parseTags(raw.tags);

  let tagsObjArr: NewsTag[] = [];
  if ((raw.news_category === "domestic" || raw.category === "domestic") && tagsArr.length > 0) {
    // 숫자코드만 종목명 변환, 그 외는 그대로!
    const codeOnly = tagsArr.filter(code => /^\d+$/.test(code));
    const assetNames = codeOnly.length > 0 ? await assetModel.getAssetNamesBySymbols(codeOnly) : {};
    tagsObjArr = tagsArr.map((code) =>
      /^\d+$/.test(code)
        ? { symbol: code, name: assetNames[code] || code }
        : { symbol: code, name: code }
    );
  } else if (tagsArr.length > 0) {
    tagsObjArr = tagsArr.map((code) => ({
      symbol: code,
      name: code,
    }));
  }

  return {
    ...raw,
    tags: tagsObjArr,
    community_sentiment: String(raw.community_sentiment ?? ""),
    assets_symbol: raw.assets_symbol ?? undefined,
    assets_market: raw.assets_market ?? undefined,
    assets_name: raw.assets_name ?? undefined,
  };
}

// ---------- 전체 뉴스 리스트 ----------
export async function getAllNews(): Promise<NewsItem[]> {
  const list = await getAllNewsRaw();

  // ① 모든 국내 종목코드 한 번에 모으기
  const allDomesticCodes = new Set<string>();
  for (const item of list) {
    item.tags = parseTags(item.tags);
    if (item.category === "domestic" && Array.isArray(item.tags)) {
      item.tags.forEach((code: string) => {
        if (/^\d+$/.test(code)) allDomesticCodes.add(code);
      });
    }
  }

  // ② 한 번만 쿼리로 종목명 매핑
  let assetNames: Record<string, string> = {};
  if (allDomesticCodes.size > 0) {
    assetNames = await assetModel.getAssetNamesBySymbols(Array.from(allDomesticCodes));
  }

  // ③ 각 뉴스의 태그를 {symbol, name} 객체 배열로 변환
  for (const item of list) {
    if (item.category === "domestic" && Array.isArray(item.tags)) {
      item.tags = item.tags.map((code: string) =>
        /^\d+$/.test(code)
          ? { symbol: code, name: assetNames[code] || code }
          : { symbol: code, name: code }
      );
    } else if (Array.isArray(item.tags)) {
      item.tags = item.tags.map((code: string) => ({
        symbol: code,
        name: code,
      }));
    }
  }
  return list;
}

// ---------- 종목(symbol) 기반 최신 뉴스 ----------
export async function getNewsByAsset(assetSymbol: string, excludeId?: number): Promise<NewsItem[]> {
  const list = await newsModel.findNewsByAsset(assetSymbol, excludeId);

  // 한 번에 국내 종목코드 모두 모아서 한 번만 매핑 (최적화)
  const allDomesticCodes = new Set<string>();
  for (const item of list) {
    item.tags = parseTags(item.tags);
    if (
      (item.category === "domestic" || item.news_category === "domestic") &&
      Array.isArray(item.tags)
    ) {
      item.tags.forEach((code: string) => {
        if (/^\d+$/.test(code)) allDomesticCodes.add(code);
      });
    }
  }
  let assetNames: Record<string, string> = {};
  if (allDomesticCodes.size > 0) {
    assetNames = await assetModel.getAssetNamesBySymbols(Array.from(allDomesticCodes));
  }

  // 태그 변환
  for (const item of list) {
    if (
      (item.category === "domestic" || item.news_category === "domestic") &&
      Array.isArray(item.tags)
    ) {
      item.tags = item.tags.map((code: string) =>
        /^\d+$/.test(code)
          ? { symbol: code, name: assetNames[code] || code }
          : { symbol: code, name: code }
      );
    } else if (Array.isArray(item.tags)) {
      item.tags = item.tags.map((code: string) => ({
        symbol: code,
        name: code,
      }));
    }
  }

  return list.map((item) => ({
    ...item,
    sentiment: item.news_sentiment ?? item.sentiment,
    tags: item.tags,
  }));
}
