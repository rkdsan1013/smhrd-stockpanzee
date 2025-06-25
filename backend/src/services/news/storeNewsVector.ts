// /backend/src/services/news/storeNewsVector.ts
import { upsertNewsVector as pgUpsertNewsVector } from "../../repositories/vectorRepo";

export interface NewsVector {
  id: string; // 뉴스 구분용, 예: 뉴스 링크
  values: number[]; // 임베딩 벡터
  metadata: {
    published_at: string;
    title_ko: string;
    summary: string;
    news_link: string;
  };
}

/**
 * PGVector DB에 뉴스 벡터를 업서트합니다.
 */
export async function upsertNewsVector(newsVector: NewsVector): Promise<void> {
  await pgUpsertNewsVector(newsVector.id, newsVector.values, newsVector.metadata);
}
