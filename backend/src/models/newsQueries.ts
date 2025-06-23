// /backend/src/models/newsQueries.ts
/* ────────────── NEWS TABLE ────────────── */
export const INSERT_NEWS = `
  INSERT INTO news
    (news_category, title, title_ko, content, thumbnail, news_link, publisher, published_at)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?)
`;

export const UPDATE_NEWS_TITLE_KO = `
  UPDATE news
  SET title_ko = ?
  WHERE id = ?
`;

export const SELECT_NEWS_BY_LINK = `
  SELECT id FROM news
  WHERE news_link = ?
  LIMIT 1
`;

/* ────────── NEWS_ANALYSIS TABLE ────────── */
export const INSERT_NEWS_ANALYSIS = `
  INSERT INTO news_analysis
    (news_id, news_sentiment, news_positive, news_negative,
     community_sentiment, summary, brief_summary, tags)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?)
`;

/* ── NEWS + ANALYSIS LEFT JOIN 조회 ── */
export const SELECT_ALL_NEWS_WITH_ANALYSIS = `
  SELECT
    n.id,
    n.title,
    n.title_ko,
    n.news_category         AS category,
    n.thumbnail             AS image,
    n.publisher,
    n.published_at,
    na.news_sentiment       AS sentiment,
    na.news_positive,
    na.news_negative,
    na.summary,
    na.brief_summary,
    na.tags
  FROM news n
  LEFT JOIN news_analysis na ON n.id = na.news_id
  ORDER BY n.published_at DESC
`;
