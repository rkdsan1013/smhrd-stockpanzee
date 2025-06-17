import axios from "axios";
import puppeteer from "puppeteer";
import cron from "node-cron";
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
    const newData = rawData.filter(item => !collectedLinks.has(item.link));
    newData.forEach(item => collectedLinks.add(item.link));

    const crawledResults = await Promise.all(
      newData.map(async (news) => {
        const { title, content } = await getArticleTitleAndContent(news.link);
        if (!title || !content) {
          console.warn(`❌ 크롤링 실패: ${news.link}`);
          return { title: "", content: "" };
        }
        return { title, content };
      })
    );

    const mappedNews = mapKrxNews(newData, crawledResults);
    const filteredNews = mappedNews.filter(item => item.content !== "");

    filteredNews.forEach((news, index) => {
  console.log(`${index + 1}. [${news.published_at.toISOString()}] ${news.title}`);
  console.log(`🔗 링크: ${news.news_link}`);
  console.log(`📰 본문:`);
  console.log(news.content);
  console.log("-".repeat(80));
});

    return filteredNews;
  } catch (error) {
    console.error("❌ 뉴스 수집 중 오류 발생:", error);
    throw error;
  }
};

// ✅ 크롤링 함수까지 통합
const getArticleTitleAndContent = async (url: string): Promise<{ title: string; content: string }> => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      slowMo: 50,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1920x1080"
      ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

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
      content: result.content.trim()
    };
  } catch (error) {
    console.error("❌ Puppeteer 크롤링 오류:", error);
    return { title: "", content: "" };
  }
};

// ✅ 스케줄러 포함 통합
export const startNewsScheduler = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ 스케줄러 실행 - 뉴스 수집 시작");
    await fetchAndProcessOneKrxNews();
  });
};