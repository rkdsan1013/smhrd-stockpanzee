// /backend/src/utils/news/cryptoNewsMapper.ts
import { INews } from "../../models/newsModel";

/**
 * CryptoCompare API 응답 데이터 타입 (일부 필드만 사용)
 */
interface CryptoNewsApiResponse {
  Data: Array<{
    id: string;
    title: string;
    imageurl: string;
    body: string;
    // 필요 시 published_on, guid, url 등 추가 필드 정의 가능
  }>;
}

/**
 * CryptoCompare API 응답 데이터를 INews 형식으로 매핑합니다.
 *
 * @param rawData API 응답 원본 데이터
 * @returns INews 배열 (모든 필수 필드가 채워짐)
 */
export const mapCryptoNews = (rawData: CryptoNewsApiResponse): INews[] => {
  if (!rawData || !Array.isArray(rawData.Data)) {
    throw new Error("잘못된 뉴스 데이터 형식입니다.");
  }

  return rawData.Data.map((news) => ({
    externalId: news.id!, // id 는 반드시 존재한다고 가정합니다.
    title: news.title,
    thumbnail: news.imageurl,
    content: news.body,
  }));
};
