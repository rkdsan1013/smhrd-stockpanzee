// /backend/src/ai/vectorDB.ts
import { promises as fs } from "fs";
import path from "path";
import * as msgpack from "msgpack-lite";
import { NewsVector } from "../services/news/storeNewsVector";

/* 데이터 파일 :  /backend/src/ai/data/vectorDB.bin */
const VECTOR_DB_PATH = path.resolve(__dirname, "data/vectorDB.bin");

/* ─ Types ──────────────────────────────────────────────── */
export interface ScoredVector {
  newsVector: NewsVector;
  score: number; // 코사인 유사도 0~1
}
interface VectorDB {
  vectors: NewsVector[];
}

/* ─ 내부 I/O ────────────────────────────────────────────── */
async function loadDB(): Promise<VectorDB> {
  try {
    const data = await fs.readFile(VECTOR_DB_PATH);
    return msgpack.decode(data) as VectorDB;
  } catch {
    return { vectors: [] };
  }
}
async function saveDB(db: VectorDB) {
  await fs.writeFile(VECTOR_DB_PATH, msgpack.encode(db));
}

/* ─ Public API ─────────────────────────────────────────── */
export async function upsertNewsVectorLocal(v: NewsVector) {
  const db = await loadDB();
  const idx = db.vectors.findIndex((x) => x.id === v.id);
  idx === -1 ? db.vectors.push(v) : (db.vectors[idx] = v);
  await saveDB(db);
}

/**
 * queryVector 와 가장 유사한 뉴스 벡터를 score 포함해 반환
 */
export async function searchNewsVectorsLocal(
  queryVector: number[],
  topK = 3,
): Promise<ScoredVector[]> {
  const db = await loadDB();

  /* 코사인 유사도 */
  const cos = (a: number[], b: number[]) => {
    let dot = 0,
      normA = 0,
      normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] ** 2;
      normB += b[i] ** 2;
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    return normA && normB ? dot / (normA * normB) : 0;
  };

  const scored = db.vectors.map<ScoredVector>((v) => ({
    newsVector: v,
    score: cos(queryVector, v.values),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
