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

export const mapKrxNews = (
  rawData: NaverNewsApiItem[],
  thumbnails: (string | null)[],
  contents: string[],
  titles: string[],
  crawledResults: CrawledNews[]
): INews[] => {
  return rawData.map((news, index) => {
    const crawled = crawledResults[index];
    return {
      news_category: "domestic",
      title: crawled.title,
      content: crawled.content,
      news_link: news.link,
      thumbnail: thumbnails[index] || "", // INews에선 string 필수라 null 대신 빈 문자열 처리
      published_at: new Date(news.pubDate),
      publisher: extractSourceTitle(news.originallink || news.link), // ✅ 추가된 부분
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