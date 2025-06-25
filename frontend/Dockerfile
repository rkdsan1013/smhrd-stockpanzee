# /frontend/Dockerfile
FROM node:22-alpine

# Alpine 패키지 업데이트 (보안 패치 적용)
RUN apk update && apk upgrade

WORKDIR /app

# 패키지 캐싱을 위해 package.json, package-lock.json 복사
COPY package*.json ./
RUN npm ci

# 전체 소스 복사 (빌드 시 캐시를 위한 용도; 로컬 볼륨 마운트로 실제 소스는 덮어씌워집니다)
COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]