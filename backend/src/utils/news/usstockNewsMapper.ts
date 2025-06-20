export interface IStockNews {
  title: string;
  content: string;
  news_link: string;
  thumbnail: string;
  published_at: Date;
  source_title: string;
}

interface RawAlphaNewsItem {
  title: string;
  url: string;
  summary: string;
  banner_image: string;
  time_published: string;
  source: string;
  ticker_sentiment: { ticker: string }[];
}

export const mapStockNews = (data: any, validSymbols: Set<string>): IStockNews[] => {
  if (!data?.feed) return [];

  return data.feed
    .filter((item: RawAlphaNewsItem) => {
      const tickers = item.ticker_sentiment.map((t) => t.ticker);
      return tickers.some((t) => validSymbols.has(t));
    })
    .map((item: RawAlphaNewsItem) => ({
      title: item.title,
      content: item.summary,
      news_link: item.url,
      thumbnail: item.banner_image,
      published_at: new Date(item.time_published),
      source_title: item.source,
    }));
};
