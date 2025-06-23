CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS news_vectors (
  id TEXT PRIMARY KEY,
  embedding VECTOR (1536),
  published_at TIMESTAMPTZ,
  title_ko TEXT,
  summary TEXT,
  news_link TEXT
);

CREATE INDEX IF NOT EXISTS idx_news_vectors_embedding ON news_vectors USING hnsw (embedding vector_cosine_ops);
