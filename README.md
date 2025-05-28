# smhrd-stockpanzee

![image](https://github.com/user-attachments/assets/32fa8dc2-860a-48af-aa48-13059568776b)

# RAG, LLM 기반 투자 정보 요약 서비스

 **실시간 뉴스 수집 · AI 요약 · 감정 분석 · 커뮤니티 여론 반영까지 한 번에!**

---

## 프로젝트 개요

본 프로젝트는 `RAG(Retrieval-Augmented Generation)` 및 `LLM(Large Language Model)` 기술을 활용하여,
실시간 투자 정보(뉴스, 공시, 차트 등)를 수집, 요약, 분석하여 개인 투자자에게 빠르고 정확한 의사결정을 지원하는 통합 웹 서비스입니다.

- **뉴스 및 공시 요약**
- **감정 분석 및 시장 심리 평가**
- **관심 종목 기반 실시간 알림**
- **주가 차트 및 기업 정보 시각화**
- **커뮤니티 여론 분석 (Reddit/X)**

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 회원가입 / 로그인 | 이메일 기반 계정 생성 및 인증 |
| 뉴스 보기 | 실시간 수집된 뉴스 요약 및 감정 분석 결과 표시 |
| 실시간 주식 차트 | TradingView API 연동 |
| 관심 종목 알림 | 키워드/종목 기반 맞춤형 알림 설정 |
| 커뮤니티 여론 분석 | Reddit 및 X(Twitter) 기반 투자 심리 추정 |
| 원문 링크 및 기업 정보 제공 | 뉴스 원문, 시가총액, 재무정보 등 부가 데이터 제공 |

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| **Frontend** | ![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=white&style=for-the-badge) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge) ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white&style=for-the-badge) ![WebSocket](https://img.shields.io/badge/WebSocket-010101?logo=websocket&logoColor=white&style=for-the-badge) |
| **Backend** | ![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white&style=for-the-badge) ![Express.js](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white&style=for-the-badge) ![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white&style=for-the-badge) ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&style=for-the-badge) ![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?logo=githubactions&logoColor=white&style=for-the-badge) |
| **AI / 분석 서버** | ![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white&style=for-the-badge) ![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white&style=for-the-badge) ![LangChain](https://img.shields.io/badge/LangChain-000000?logo=data&logoColor=white&style=for-the-badge) ![GPT-4.1mini](https://img.shields.io/badge/OpenAI%20GPT--4o-412991?logo=openai&logoColor=white&style=for-the-badge) ![RAG](https://img.shields.io/badge/RAG-FF5733?logo=data&logoColor=white&style=for-the-badge) |
| **UI/UX & Design** | ![Figma](https://img.shields.io/badge/Figma-F24E1E?logo=figma&logoColor=white&style=for-the-badge) |

### 외부 API
- `SERP Finance News API` (뉴스 수집)
- `TradingView API` (차트 데이터)
- `Reddit API`, `X API` (여론 수집)
- `yfinance`, `Alpha Vantage`, `Coindesk`, 등

---

## 실행 방법

### 사전 준비
- `.env` 파일에 API 키, DB 정보 등을 등록
- Docker 설치 필요

### 로컬 실행
```bash
git clone https://github.com/your-org/investment-rag-service.git
cd investment-rag-service
docker-compose up --build
```
---
```
개발 일정
기간	내용
5/21 ~ 5/27	기획 및 요구사항 분석
5/28 ~ 6/15	데이터 구조 설계 및 UI 프로토타입 제작
6/16 ~ 6/30	기능 구현 (API 연동, 분석 모델 적용 등)
7/01 ~ 7/04	통합 테스트 및 오류 수정
7/05 ~ 7/08	최종 발표 준비 및 시연
```
---
```
팀 소개 - 팬지's(Panzee's)
이름	역할
조성근	PM, 산출물 관리, 데이터 모델링
김현우	데이터 수집, DB, 프론트엔드, 백엔드
서강산	백엔드, 프론트엔드, DB, 데이터 수집
주재건	프론트엔드, 백엔드, 모델링, 데이터 수집
```
---
```
기대 효과
투자 정보 격차 해소 및 투자자 보호
초보자도 쉽게 이해 가능한 UI/UX
커스터마이징된 실시간 투자 알림 제공
프리미엄 정보 구독 서비스로 수익화 가능
```
---
```
라이선스
본 프로젝트는 MIT License를 따릅니다.
```




