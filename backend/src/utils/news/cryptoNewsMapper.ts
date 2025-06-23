// /backend/src/utils/news/cryptoNewsMapper.ts
interface CryptoNewsApiResponse {
  Data: Array<{
    id: string;
    guid: string;
    published_on: number;
    imageurl: string;
    title: string;
    url: string;
    body: string;
    tags: string;
    lang: string;
    upvotes: string;
    downvotes: string;
    categories: string;
    source_info: {
      name: string;
      img: string;
      lang: string;
    };
    source: string;
  }>;
}

export interface INews {
  // models/newsModel.ts에 정의된 인터페이스와 동일한 형태로 반환합니다.
  news_category: "domestic" | "international" | "crypto";
  title: string;
  title_ko?: string;
  content: string;
  thumbnail: string;
  news_link: string;
  publisher: string;
  published_at: Date;
}

export const mapCryptoNews = (rawData: CryptoNewsApiResponse): INews[] => {
  if (!rawData || !Array.isArray(rawData.Data)) {
    throw new Error("잘못된 뉴스 데이터 형식입니다.");
  }
  return rawData.Data.map((news) => ({
    news_category: "crypto",
    title: news.title,
    // title_ko는 이후 번역/분석 결과에 따라 업데이트되므로 기본값은 undefined로 둡니다.
    content: news.body,
    news_link: news.url,
    thumbnail: news.imageurl,
    // publisher는 source_info.name으로 설정
    publisher: news.source_info.name,
    published_at: new Date(news.published_on * 1000),
  }));
};
