// /backend/src/services/news/storeNewsVector.ts
import { upsertNewsVectorLocal } from "../../ai/vectorDB";

export interface NewsVector {
  id: string; // 고유 식별자 (예: 뉴스 링크 또는 생성된 뉴스 ID)
  values: number[];
  metadata: {
    published_at: string;
    title_ko: string; // 영문 타이틀 제거, 한글 제목만 저장됨
    summary: string;
    news_link: string;
  };
}

/**
 * 로컬 벡터 DB에 뉴스 벡터를 업서트합니다.
 */
export async function upsertNewsVector(newsVector: NewsVector): Promise<void> {
  await upsertNewsVectorLocal(newsVector);
}
