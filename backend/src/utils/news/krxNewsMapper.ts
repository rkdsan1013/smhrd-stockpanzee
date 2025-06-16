export interface NaverNewsApiItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  originallink?: string;
}

export interface IKrxNews {
  title: string;
  content: string;
  news_link: string;
  thumbnail: string | null;
  published_at: Date;
  source_title: string;
}

export const mapKrxNews = (
  rawData: NaverNewsApiItem[], 
  thumbnails: (string | null)[], 
  contents: string[]
): IKrxNews[] => {
  return rawData.map((news, index) => ({
    title: news.title.replace(/<[^>]*>/g, ""),
    content: contents[index] || news.description.replace(/<[^>]*>/g, ""),
    news_link: news.link,
    thumbnail: thumbnails[index] || null,
    published_at: new Date(news.pubDate),
    source_title: news.originallink || "네이버뉴스",
  }));
};