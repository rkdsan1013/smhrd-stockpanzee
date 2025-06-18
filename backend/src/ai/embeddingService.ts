// /backend/src/ai/embeddingService.ts
import axios from "axios";
import dotenv from "dotenv";
import vectorDB from "./vectorDB";
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const EMBEDDING_API_URL = "https://api.openai.com/v1/embeddings";

interface OpenAIEmbeddingItem {
  embedding: number[];
  index: number;
  object: string;
}

interface OpenAIEmbeddingResponse {
  object: string;
  data: OpenAIEmbeddingItem[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await axios.post<OpenAIEmbeddingResponse>(
      EMBEDDING_API_URL,
      {
        input: text,
        model: "text-embedding-3-small",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      },
    );
    const vector: number[] = response.data.data[0].embedding;
    return vector;
  } catch (error) {
    console.error("OpenAI Embedding API 호출 실패", error);
    throw error;
  }
}

/**
 * 텍스트 임베딩을 생성하고, 해당 벡터를 VectorDB에 추가한 후 저장(디스크 기록)한다.
 */
export async function embedAndStore(
  newsId: number,
  text: string,
  meta: { title?: string; publishedAt?: Date } = {},
): Promise<void> {
  const vector = await getEmbedding(text);
  vectorDB.addItem({
    newsId,
    vector,
    meta,
  });
  // 변경된 인덱스를 디스크의 "ai/data/hnsw_index.bin"에 저장
  await vectorDB.saveIndex();
}
