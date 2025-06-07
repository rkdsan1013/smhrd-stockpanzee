import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

// 🟩 네이버 API 인증 정보
const NAVER_CLIENT_ID = "4ttiJ6J5Wy6NCRUuWa4f";
const NAVER_CLIENT_SECRET = "9rpUKKTDAg";

// 🟥 정치 키워드 (제목/요약 필터링용)
const politicalKeywords = [
  "윤석열", "이재명", "민주당", "국민의힘", "총선", "대선", "대통령",
  "국회", "의원", "정당", "공약", "후보", "선거", "정치", "정책"
];

function isPolitical(text: string): boolean {
  return politicalKeywords.some(keyword => text.includes(keyword));
}

// 🖼️ 기사 링크에서 썸네일 가져오기 (og:image)
async function getThumbnailFromArticle(url: string): Promise<string | null> {
  try {
    const res = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const $ = cheerio.load(res.data);
    return $("meta[property='og:image']").attr("content") || null;
  } catch {
    console.warn("❌ 썸네일 크롤링 실패:", url);
    return null;
  }
}

// 📰 뉴스 수집 (정치 뉴스 필터링 포함)
async function fetchNewsFromNaver(query: string, display: number = 20) {
  const url = "https://openapi.naver.com/v1/search/news.json";

  const response = await axios.get(url, {
    params: { query, display, sort: "date" },
    headers: {
      "X-Naver-Client-Id": NAVER_CLIENT_ID,
      "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    },
  });

  const items = response.data.items;

  const newsList = await Promise.all(
    items.map(async (item: any) => {
      const title = item.title.replace(/<[^>]*>/g, "");
      const desc = item.description.replace(/<[^>]*>/g, "");
      const link = item.link;

      if (isPolitical(title + desc)) return null;

      const thumbnail = await getThumbnailFromArticle(link);

      return {
        title,
        description: desc,
        link,
        thumbnail,
        pubDate: item.pubDate,
      };
    })
  );

  return newsList.filter(item => item !== null);
}

// 💾 기존 뉴스와 병합 & 중복 제거 후 저장
function saveMergedNews(newData: any[], filename: string) {
  const filePath = path.resolve(__dirname, filename);
  let existing: any[] = [];

  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, "utf-8");
    existing = JSON.parse(raw);
  }

  const existingTitles = new Set(existing.map(item => item.title));
  const uniqueNews = newData.filter(item => !existingTitles.has(item.title));

  const merged = [...existing, ...uniqueNews];

  fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), "utf-8");
  console.log(`✅ 저장 완료 (${uniqueNews.length}개 추가됨): ${filePath}`);
}

// 🏁 실행
fetchNewsFromNaver("주식", 20).then(newsList => {
  saveMergedNews(newsList, "stock_kor_news.json");
});