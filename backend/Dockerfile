# backend/Dockerfile
FROM node:22-alpine

# Alpine 패키지 업데이트 (보안 패치 적용)
RUN apk update && apk upgrade && \
    apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont \
      dumb-init

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# 패키지 캐싱을 위해 package.json, package-lock.json 복사
COPY package*.json ./
RUN npm ci

# 전체 소스 복사 (개발 시 소스 변경은 볼륨 마운트로 덮어씌워집니다)
COPY . .

EXPOSE 5000
CMD ["npm", "run", "dev"]