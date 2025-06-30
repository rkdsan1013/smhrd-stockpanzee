# /_db/restore.sh
#!/usr/bin/env bash
set -euo pipefail

# (Windows Git Bash) 경로 변환 방지
export MSYS_NO_PATHCONV=1

# .env에서 값 로드 (DB_USER, DB_PASS, DB_NAME)
# └ .env 파일에 POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB 로 정의돼 있어야 합니다
if [ -f "./_db/.env" ]; then
  export $(grep -v '^#' ./_db/.env | xargs)
else
  echo "❌ ./_db/.env 파일을 찾을 수 없습니다."
  exit 1
fi

DB_USER=${POSTGRES_USER}
DB_PASS=${POSTGRES_PASSWORD}
DB_NAME=${POSTGRES_DB}

echo "🗑 1) 기존 news_vectors 테이블 삭제"
docker exec -i stockpanzee-db sh -c \
  "psql -U ${DB_USER} -d ${DB_NAME} -c \"DROP TABLE IF EXISTS news_vectors;\""

echo "📦 2) 덤프 복원 (/backup/vectordata.dump → ${DB_NAME})"
docker exec -i stockpanzee-db sh -c \
  "PGPASSWORD=${DB_PASS} pg_restore \
    --verbose \
    --clean \
    --if-exists \
    --no-owner \
    -U ${DB_USER} \
    -d ${DB_NAME} \
    /backup/vectordata.dump"

echo "✅ 3) 복원 결과 검증"
docker exec -i stockpanzee-db sh -c \
  "psql -U ${DB_USER} -d ${DB_NAME} -c \"SELECT COUNT(*) AS restored_rows FROM news_vectors;\""