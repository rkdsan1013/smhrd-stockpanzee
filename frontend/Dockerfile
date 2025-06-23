# /frontend/Dockerfile
FROM node:20-alpine
WORKDIR /app

# 패키지 설치
COPY package*.json ./
RUN npm ci

# 소스 전체 복사 (로컬 파일이 마운트되므로 이는 빌드 시 캐시 용도)
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]