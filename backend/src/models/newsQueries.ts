// /backend/src/models/newsQueries.ts
export const INSERT_NEWS = `
  INSERT INTO news (news_category, title, title_ko, content, thumbnail, news_link, publisher, published_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

export const SELECT_NEWS_BY_LINK = `
  SELECT id FROM news WHERE news_link = ? LIMIT 1
`;

export const INSERT_NEWS_ANALYSIS = `
  INSERT INTO news_analysis (news_id, news_sentiment, news_positive, news_negative, community_sentiment, summary, brief_summary, tags)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;
