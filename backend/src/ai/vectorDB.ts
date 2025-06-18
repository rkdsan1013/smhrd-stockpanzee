// /backend/src/ai/vectorDB.ts
import fs from "fs/promises";
import path from "path";

// hnswlib-node 모듈에서 HierarchicalNSW 생성자를 추출합니다.
const { HierarchicalNSW } = require("hnswlib-node");

export interface VectorItem {
  newsId: number;
  vector: number[];
  meta?: {
    title?: string;
    publishedAt?: Date;
  };
}

class VectorDB {
  private index: any;
  private dimension: number;
  private maxElements: number;
  private indexFilePath: string;
  private idToVectorItem = new Map<number, VectorItem>();

  constructor(dimension: number, maxElements: number) {
    this.dimension = dimension;
    this.maxElements = maxElements;
    this.indexFilePath = path.join(__dirname, "hnsw_index.bin");

    // HierarchicalNSW 생성자를 사용하여 인덱스 인스턴스를 생성합니다.
    this.index = new HierarchicalNSW("cosine", this.dimension);

    this.loadIndex()
      .then(() => {
        console.log("HNSW 인덱스 로드 완료");
      })
      .catch((error: any) => {
        console.error("인덱스 로드 실패:", error);
        console.log("새로운 인덱스 생성 중...");
        this.index.initIndex(this.maxElements);
      });
  }

  async loadIndex(): Promise<void> {
    try {
      await fs.access(this.indexFilePath);
      this.index.readIndex(this.indexFilePath);
      console.log("인덱스 파일 로드 성공");
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.log("인덱스 파일이 존재하지 않습니다. 새 인덱스를 생성합니다.");
        this.index.initIndex(this.maxElements);
      } else {
        throw error;
      }
    }
  }

  async saveIndex(): Promise<void> {
    await this.index.writeIndex(this.indexFilePath);
    console.log("인덱스 파일 저장 완료");
  }

  addItem(item: VectorItem): void {
    this.idToVectorItem.set(item.newsId, item);
    this.index.addPoint(item.vector, item.newsId);
  }

  findSimilar(queryVector: number[], k: number = 2, threshold = 0.75): VectorItem[] {
    const result = this.index.searchKnn(queryVector, k);
    // 결과가 없거나 예상 구조(labels, distances 속성)가 없으면 빈 배열 반환
    if (!result || !result.labels || !result.distances) {
      return [];
    }
    const vectorItems: VectorItem[] = [];
    for (let i = 0; i < result.labels.length; i++) {
      const label = result.labels[i];
      const distance = result.distances[i];
      const similarity = 1 - distance;
      if (similarity >= threshold) {
        const item = this.idToVectorItem.get(label);
        if (item) {
          vectorItems.push(item);
        }
      }
    }
    return vectorItems;
  }

  getAllItems(): VectorItem[] {
    return Array.from(this.idToVectorItem.values());
  }
}

export default new VectorDB(1536, 10000);
