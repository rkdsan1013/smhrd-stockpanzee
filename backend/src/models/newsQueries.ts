// /backend/src/models/newsQueries.ts
/** 조회수 증가 */
export const UPDATE_NEWS_VIEW_COUNT = `
  UPDATE news
  SET view_count = view_count + 1
  WHERE id = ?
`;

/** 단일 뉴스 + 분석(join) 조회 (view_count 포함) */
export const SELECT_NEWS_WITH_ANALYSIS_BY_ID = `
  SELECT
    n.id,
    n.title_ko,
    n.news_category,
    n.thumbnail,
    n.news_link,
    n.publisher,
    n.published_at,
    n.view_count,
    na.summary,
    na.news_positive,
    na.news_negative,
    na.community_sentiment,
    na.news_sentiment,
    na.tags,
    a.symbol     AS assets_symbol,
    a.market     AS assets_market,
    a.name       AS assets_name
  FROM news n
  LEFT JOIN news_analysis na ON n.id = na.news_id
  LEFT JOIN assets a ON JSON_CONTAINS(na.tags, JSON_QUOTE(a.symbol), '$')
  WHERE n.id = ?
  LIMIT 1
`;

/** 전체 뉴스 + 분석(join) 목록 조회 (view_count 포함) */
export const SELECT_ALL_NEWS_WITH_ANALYSIS = `
  SELECT
    n.id,
    n.title,
    n.title_ko,
    n.news_category    AS category,
    n.thumbnail        AS image,
    n.publisher,
    n.published_at,
    n.view_count,
    na.news_sentiment  AS sentiment,
    na.news_positive,
    na.news_negative,
    na.summary,
    na.brief_summary,
    na.tags
  FROM news n
  LEFT JOIN news_analysis na ON n.id = na.news_id
  ORDER BY n.published_at DESC
`;

/** 종목(asset) 기반 뉴스 필터 조회 (view_count 포함) */
export const SELECT_NEWS_BY_ASSET = `
  SELECT
    n.id,
    n.title,
    n.title_ko,
    n.news_category   AS news_category,
    n.thumbnail       AS thumbnail,
    n.publisher,
    n.published_at,
    n.view_count,
    na.news_sentiment AS news_sentiment,
    na.brief_summary  AS brief_summary,
    na.summary        AS summary,
    na.news_positive  AS news_positive,
    na.news_negative  AS news_negative,
    na.tags           AS tags
  FROM news n
  LEFT JOIN news_analysis na ON n.id = na.news_id
  WHERE JSON_CONTAINS(na.tags, JSON_QUOTE(?), '$')
  /* excludeId 파라미터가 있으면 AND n.id != ? 를 추가 */
  ORDER BY n.published_at DESC
`;
