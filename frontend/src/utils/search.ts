// /frontend/src/utils/search.ts
import Fuse from "fuse.js";
import type { IFuseOptions } from "fuse.js";

export interface SearchOptions<T> {
  // IFuseOptions<T> 안에 정의된 keys·threshold 타입을 재활용
  keys: IFuseOptions<T>["keys"];
  threshold?: IFuseOptions<T>["threshold"];
}

/**
 * list 안에서 term 으로 퍼지 검색 후 item[]만 반환
 */
export function fuzzySearch<T>(list: T[], term: string, options: SearchOptions<T>): T[] {
  if (!term.trim()) return [];

  const fuse = new Fuse<T>(list, {
    keys: options.keys,
    // threshold: 0~1 사이, 작을수록 엄격
    threshold: options.threshold ?? 0.3,
  });

  return fuse.search(term).map((res) => res.item);
}
