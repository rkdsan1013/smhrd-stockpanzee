# backend/Dockerfile
FROM node:22-alpine

# Alpine 패키지 + Docker CLI + PostgreSQL 클라이언트 설치
RUN apk update && apk upgrade && \
    apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      dumb-init \
      postgresql-client \
      docker-cli           # ← Docker CLI 추가

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000
CMD ["npm", "run", "dev"]