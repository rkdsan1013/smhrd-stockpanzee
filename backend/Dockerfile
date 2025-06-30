# backend/Dockerfile
FROM node:22-alpine

RUN apk update && apk upgrade && \
    apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      dumb-init \
      postgresql-client   # ← 버전 고정 없이 설치 (v16+ 사용됨)

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5000
CMD ["npm", "run", "dev"]