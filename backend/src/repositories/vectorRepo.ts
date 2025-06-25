// /backend/src/repositories/vectorRepo.ts
import pool from "../config/pg";

export interface VectorNewsMetadata {
  published_at: string;
  title_ko: string;
  summary: string;
  news_link: string;
}

export interface ScoredVector {
  newsVector: {
    id: string;
    // 변경: 벡터는 배열로 반환하며, DB에 저장할 때는 문자열로 저장됩니다.
    values: number[];
    metadata: VectorNewsMetadata;
  };
  score: number;
}

/**
 * 숫자 배열을 대괄호로 감싼 문자열로 변환합니다.
 * 예: [0.1, 0.2, 0.3] -> "[0.1,0.2,0.3]"
 */
function formatVector(vector: number[]): string {
  return `[${vector.join(",")}]`;
}

/**
 * 뉴스 벡터를 PGVector 테이블에 업서트합니다.
 */
export async function upsertNewsVector(
  id: string,
  embedding: number[],
  metadata: VectorNewsMetadata,
): Promise<void> {
  const vectorString = formatVector(embedding);

  await pool.query(
    `INSERT INTO news_vectors
       (id, embedding, published_at, title_ko, summary, news_link)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (id)
     DO UPDATE SET embedding = EXCLUDED.embedding,
                   published_at = EXCLUDED.published_at,
                   title_ko = EXCLUDED.title_ko,
                   summary = EXCLUDED.summary,
                   news_link = EXCLUDED.news_link`,
    [
      id,
      vectorString,
      metadata.published_at,
      metadata.title_ko,
      metadata.summary,
      metadata.news_link,
    ],
  );
}

/**
 * 주어진 쿼리 임베딩과 유사한 뉴스 벡터들을 검색합니다.
 */
export async function searchSimilarNews(
  queryEmbedding: number[],
  topK: number,
  threshold: number = 0.25,
): Promise<ScoredVector[]> {
  // 검색 시에도 올바른 형식의 벡터 문자열로 변환 후 사용합니다.
  const vectorString = formatVector(queryEmbedding);

  const { rows } = await pool.query(
    `SELECT id, title_ko, summary, news_link, published_at,
            1 - (embedding <=> $1) AS score,
            embedding  -- 이 컬럼은 검색 결과로도 반환됨 (원래는 문자열일 것이나, 후처리할 수 있음)
       FROM news_vectors
      WHERE 1 - (embedding <=> $1) >= $2
      ORDER BY embedding <=> $1
      LIMIT $3`,
    [vectorString, threshold, topK],
  );

  return rows.map((row: any) => ({
    newsVector: {
      id: row.id,
      // 참고: DB에 저장된 embedding은 문자열이므로, 필요에 따라 파싱 작업을 할 수 있습니다.
      values: row.embedding,
      metadata: {
        published_at: row.published_at,
        title_ko: row.title_ko,
        summary: row.summary,
        news_link: row.news_link,
      },
    },
    score: row.score,
  }));
}
