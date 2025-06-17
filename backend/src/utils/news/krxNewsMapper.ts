export interface NaverNewsApiItem {
  title: string;
  link: string;
  originallink: string;
  description: string;
  pubDate: string;
  thumbnail?: string;
}

export interface CrawledNews {
  title: string;
  content: string;
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
  contents: string[],
  titles: string[],
  crawledResults: CrawledNews[]
): IKrxNews[] => {
  return rawData.map((news, index) => {
    const crawled = crawledResults[index];
    return {
      title: crawled.title,
      content: crawled.content,
      news_link: news.link,
      thumbnail: thumbnails[index] || null,  // 🔧 썸네일 제대로 할당
      published_at: new Date(news.pubDate),
      source_title: extractSourceTitle(news.originallink || news.link)
    };
  });
};


const extractSourceTitle = (url: string): string => {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return hostname;
  } catch {
    return "unknown";
  }
};