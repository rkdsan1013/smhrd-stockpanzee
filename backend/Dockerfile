# backend/Dockerfile
FROM node:20-alpine
WORKDIR /app

# 패키지 캐싱을 위해 package.json 먼저 복사
COPY package*.json ./
RUN npm ci

# 전체 소스 복사 (개발 시 소스 변경이 바로 반영되도록 볼륨 마운트로 덮어씁니다)
COPY . .

EXPOSE 5000
CMD ["npm", "run", "dev"]