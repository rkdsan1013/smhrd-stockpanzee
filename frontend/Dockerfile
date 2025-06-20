# frontend/Dockerfile
FROM node:20-alpine
WORKDIR /app

# 패키지 설치
COPY package*.json ./
RUN npm ci

# 소스 전체 복사
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]