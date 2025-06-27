# backend/Dockerfile
FROM node:22-alpine

# Alpine 패키지 업데이트 + 필요한 툴 설치
RUN apk update && apk upgrade && \
    apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      dumb-init \
      postgresql-client        # ← pg_dump 등 사용 가능

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# 패키지 설치
COPY package*.json ./
RUN npm ci

# 앱 소스 복사
COPY . .

EXPOSE 5000
CMD ["npm", "run", "dev"]