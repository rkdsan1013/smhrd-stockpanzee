// /backend/src/ai/embeddingService.ts
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_EMBEDDING_URL = "https://api.openai.com/v1/embeddings";

interface EmbeddingData {
  embedding: number[];
  index: number;
  object: string;
}

interface EmbeddingResponse {
  data: EmbeddingData[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await axios.post<EmbeddingResponse>(
      OPENAI_EMBEDDING_URL,
      {
        model: "text-embedding-3-small",
        input: text,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      },
    );
    return response.data.data[0].embedding;
  } catch (error) {
    console.error("Embedding API 호출 실패:", error);
    throw error;
  }
}
