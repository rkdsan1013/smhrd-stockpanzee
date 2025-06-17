import axios from "axios";
import puppeteer from "puppeteer";
import cron from "node-cron";
import * as cheerio from "cheerio";
import { mapKrxNews, IKrxNews, NaverNewsApiItem } from "../../utils/news/krxNewsMapper";

const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;
const NAVER_API_URL = "https://openapi.naver.com/v1/search/news.json";

interface NaverApiResponse {
  items: NaverNewsApiItem[];
}

let collectedLinks: Set<string> = new Set();

export const fetchAndProcessOneKrxNews = async (): Promise<IKrxNews[]> => {
  try {
    console.log("📢 주식 뉴스 수집 시작");

    const response = await axios.get<NaverApiResponse>(NAVER_API_URL, {
      params: { query: "주식", display: 20, sort: "date" },
      headers: {
        "X-Naver-Client-Id": CLIENT_ID,
        "X-Naver-Client-Secret": CLIENT_SECRET,
      },
    });

    const rawData = response.data.items;
    console.log(`수집된 뉴스 전체 개수: ${rawData.length}`);

    const newData = rawData.filter(item => !collectedLinks.has(item.link));
    newData.forEach(item => collectedLinks.add(item.link));

    const [thumbnails, crawledResults] = await Promise.all([
      Promise.all(newData.map(item => getThumbnail(item.link))),
      Promise.all(newData.map(item => getArticleTitleAndContent(item.link))),
    ]);

    const titles = crawledResults.map(r => r.title);
    const contents = crawledResults.map(r => r.content);

    let newsItems = mapKrxNews(newData, thumbnails, contents, titles, crawledResults);

    newsItems = newsItems.filter(item => item.content !== "");
    const seen = new Set<string>();
    newsItems = newsItems.filter(item => {
      const key = `${item.title}|${item.news_link}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`중복 제거 후 뉴스 개수: ${newsItems.length}`);
    return newsItems;

  } catch (error) {
    console.error("❌ 뉴스 수집 중 오류 발생:", error);
    throw error;
  }
};

const getArticleTitleAndContent = async (
  url: string
): Promise<{ title: string; content: string }> => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      slowMo: 50,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.setUserAgent("Mozilla/5.0 (...) Chrome/120 Safari/537.36");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    const result = await page.evaluate(() => {
      const title = document.querySelector("title")?.innerText || "";
      const article = document.querySelector("article") || document.body;
      const content = article?.innerText || "";
      return { title, content };
    });

    await browser.close();

    if (!result.content || result.content.trim().length < 50) {
      return { title: "", content: "" };
    }

    return {
      title: result.title.trim(),
      content: result.content.trim(),
    };
  } catch (error) {
    console.error("❌ Puppeteer 크롤링 오류:", error);
    return { title: "", content: "" };
  }
};

const getThumbnail = async (url: string): Promise<string | null> => {
  try {
    const res = await axios.get<string>(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const $ = cheerio.load(res.data);
    return $("meta[property='og:image']").attr("content") || null;
  } catch {
    console.warn(`❌ 썸네일 수집 실패: ${url}`);
    return null;
  }
};

export const startNewsScheduler = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ 스케줄러 실행 - 뉴스 수집 시작");
    await fetchAndProcessOneKrxNews();
  });
};
