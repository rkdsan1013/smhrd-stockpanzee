// /backend/src/services/news/cryptoNewsService.ts
import { mapCryptoNews } from "../../utils/news/cryptoNewsMapper";
// import { createNews } from "../../models/newsModel"; // DB 저장 로직은 주석 처리

const CRYPTO_NEWS_API_URL =
  process.env.CRYPTO_NEWS_API_URL || "https://min-api.cryptocompare.com/data/v2/news/?lang=EN";

/**
 * 암호화폐 뉴스 API를 호출한 후, 응답 데이터를 매핑하여
 * DB 저장 대신 콘솔 로그로 결과를 확인합니다.
 */
export const fetchAndStoreCryptoNews = async (): Promise<void> => {
  // native fetch 사용 (Node.js v18 이상에서 사용 가능)
  const response = await fetch(CRYPTO_NEWS_API_URL);
  if (!response.ok) {
    throw new Error(`뉴스 API 요청 실패: ${response.status}`);
  }

  const rawData = await response.json();
  const newsItems = mapCryptoNews(rawData);

  // 테스트 목적: 매핑된 뉴스 데이터 콘솔에 출력
  console.log("수집된 뉴스 데이터:");
  newsItems.forEach((news, index) => {
    console.log(`---------------------- [뉴스 ${index + 1}] ----------------------`);
    console.log(`외부 ID : ${news.externalId}`);
    console.log(`타이틀  : ${news.title}`);
    console.log(`썸네일  : ${news.thumbnail}`);
    console.log(`본문    : ${news.content}`);
  });

  // DB에 저장하려면 아래 주석을 해제하여 사용합니다.
  // for (const news of newsItems) {
  //   await createNews(news);
  // }
};
