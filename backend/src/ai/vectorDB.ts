import { promises as fs } from "fs";
import path from "path";
import * as msgpack from "msgpack-lite";
import { NewsVector } from "../services/news/storeNewsVector";

// 벡터 DB 데이터 파일은 ai/data/vectorDB.bin 에 저장됩니다.
const VECTOR_DB_PATH = path.resolve(__dirname, "data/vectorDB.bin");

interface VectorDB {
  vectors: NewsVector[];
}

async function loadDB(): Promise<VectorDB> {
  try {
    const data = await fs.readFile(VECTOR_DB_PATH);
    const decoded = msgpack.decode(data);
    return decoded as VectorDB;
  } catch (error) {
    return { vectors: [] };
  }
}

async function saveDB(db: VectorDB): Promise<void> {
  const encoded = msgpack.encode(db);
  await fs.writeFile(VECTOR_DB_PATH, encoded);
}

export async function upsertNewsVectorLocal(newsVector: NewsVector): Promise<void> {
  const db = await loadDB();
  const index = db.vectors.findIndex((v) => v.id === newsVector.id);
  if (index !== -1) {
    db.vectors[index] = newsVector;
  } else {
    db.vectors.push(newsVector);
  }
  await saveDB(db);
}

export async function searchNewsVectorsLocal(
  queryVector: number[],
  topK: number = 3,
): Promise<NewsVector[]> {
  const db = await loadDB();
  function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) throw new Error("Vector dimensions do not match");
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
  }
  const scored = db.vectors.map((vec) => ({
    newsVector: vec,
    score: cosineSimilarity(queryVector, vec.values),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((item) => item.newsVector);
}
