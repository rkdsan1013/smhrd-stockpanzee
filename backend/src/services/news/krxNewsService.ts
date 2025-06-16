import axios from "axios";
import * as cheerio from "cheerio";
import { mapKrxNews, IKrxNews, NaverNewsApiItem } from "../../utils/news/krxNewsMapper";
import { getArticleContent } from "./articleContentService";

const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const NAVER_API_URL = "https://openapi.naver.com/v1/search/news.json";

async function getThumbnail(url: string): Promise<string | null> {
  try {
    const response = await axios.get<string>(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(response.data);
    return $("meta[property='og:image']").attr("content") || null;
  } catch {
    console.warn(`❌ 썸네일 수집 실패: ${url}`);
    return null;
  }
}

export const fetchAndProcessOneKrxNews = async (): Promise<IKrxNews[]> => {
  try {
    console.log("📢 주식 뉴스 수집 시작");

    const response = await axios.get<{ items: NaverNewsApiItem[] }>(NAVER_API_URL, {
      params: { query: "주식", display: 20, sort: "date" },
      headers: {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
      },
    });

    const rawData = response.data.items;
    console.log(`수집된 뉴스 전체 개수: ${rawData.length}`);

    const thumbnails = await Promise.all(rawData.map((item) => getThumbnail(item.link)));
    const contents = await Promise.all(rawData.map((item) => getArticleContent(item.link)));

    const newsItems: IKrxNews[] = mapKrxNews(rawData, thumbnails, contents);
    return newsItems;

  } catch (error) {
    console.error("주식 뉴스 처리 중 오류 발생:", error);
    throw error;
  }
};