// /backend/src/ai/vectorDB.ts
import fs from "fs/promises";
import path from "path";

export interface VectorItem {
  newsId: number;
  vector: number[];
  meta?: {
    title?: string;
    publishedAt?: Date;
  };
}

class VectorDB {
  private items: VectorItem[] = [];
  private dataFilePath: string;

  constructor() {
    this.dataFilePath = path.join(__dirname, "vectorDBData.json");
    this.loadFromFile()
      .then(() => {
        console.log("VectorDB 데이터 로드 완료");
      })
      .catch((error) => {
        console.error("VectorDB 데이터 로드 실패:", error);
      });
  }

  async loadFromFile(): Promise<void> {
    try {
      const data = await fs.readFile(this.dataFilePath, "utf-8");
      this.items = JSON.parse(data, (key, value) => {
        if (key === "publishedAt" && typeof value === "string") {
          return new Date(value);
        }
        return value;
      });
    } catch (error: any) {
      if (error.code === "ENOENT") {
        this.items = [];
      } else {
        throw error;
      }
    }
  }

  async saveToFile(): Promise<void> {
    const data = JSON.stringify(this.items, null, 2);
    await fs.writeFile(this.dataFilePath, data, "utf-8");
  }

  async addItem(item: VectorItem): Promise<void> {
    this.items.push(item);
    await this.saveToFile();
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, value, i) => sum + value * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
    const normB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
    return dotProduct / (normA * normB);
  }

  findSimilar(queryVector: number[], threshold = 0.8): VectorItem[] {
    return this.items.filter((item) => {
      if (item.vector.length !== queryVector.length) return false;
      return this.cosineSimilarity(item.vector, queryVector) >= threshold;
    });
  }

  getAllItems(): VectorItem[] {
    return this.items;
  }
}

export default new VectorDB();
