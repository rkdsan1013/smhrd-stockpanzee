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
  title: string;
  content: string;
  news_link: string;
  thumbnail: string;
  published_at: Date;
  source_title: string;
}

export const mapCryptoNews = (rawData: CryptoNewsApiResponse): INews[] => {
  if (!rawData || !Array.isArray(rawData.Data)) {
    throw new Error("잘못된 뉴스 데이터 형식입니다.");
  }
  return rawData.Data.map((news) => ({
    title: news.title,
    content: news.body,
    news_link: news.url,
    thumbnail: news.imageurl,
    published_at: new Date(news.published_on * 1000),
    source_title: news.source_info.name,
  }));
};
