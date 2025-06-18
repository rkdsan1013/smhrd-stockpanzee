// // /backend/src/ai/embeddingService.ts
// import axios from "axios";
// import dotenv from "dotenv";
// dotenv.config();

// const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
// const EMBEDDING_API_URL = "https://api.openai.com/v1/embeddings";

// interface OpenAIEmbeddingItem {
//   embedding: number[];
//   index: number;
//   object: string;
// }

// interface OpenAIEmbeddingResponse {
//   object: string;
//   data: OpenAIEmbeddingItem[];
//   model: string;
//   usage: {
//     prompt_tokens: number;
//     total_tokens: number;
//   };
// }

// export async function getEmbedding(text: string): Promise<number[]> {
//   try {
//     const response = await axios.post<OpenAIEmbeddingResponse>(
//       EMBEDDING_API_URL,
//       {
//         input: text,
//         model: "text-embedding-3-small",
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${OPENAI_API_KEY}`,
//         },
//       },
//     );
//     const vector: number[] = response.data.data[0].embedding;
//     return vector;
//   } catch (error) {
//     console.error("OpenAI Embedding API 호출 실패", error);
//     throw error;
//   }
// }

// export async function embedAndStore(
//   newsId: number,
//   text: string,
//   meta: { title?: string; publishedAt?: Date } = {},
// ): Promise<void> {
//   const vector = await getEmbedding(text);
//   vectorDB.addItem({
//     newsId,
//     vector,
//     meta,
//   });
// }