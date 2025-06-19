// // ✅ /src/services/news/krxNewsService.ts

// import axios from "axios";
// import puppeteer from "puppeteer";
// import cron from "node-cron";
// import * as cheerio from "cheerio";

// import { mapKrxNews, IKrxNews, NaverNewsApiItem } from "../../utils/news/krxNewsMapper";
// import { createNewsWithTags } from "../../models/newsModel";
// import { findAllDomesticAssets } from "../../models/assetModel";

// const CLIENT_ID = process.env.CLIENT_ID!;
// const CLIENT_SECRET = process.env.CLIENT_SECRET!;
// const NAVER_API_URL = "https://openapi.naver.com/v1/search/news.json";

// interface NaverApiResponse {
//   items: NaverNewsApiItem[];
// }

// let collectedLinks: Set<string> = new Set();

// export const fetchAndProcessSmartKrxNews = async (): Promise<void> => {
//   try {
//     console.log("📢 주식 뉴스 수집 시작");

//     const response = await axios.get<NaverApiResponse>(NAVER_API_URL, {
//       params: { query: "주식", display: 20, sort: "date" },
//       headers: {
//         "X-Naver-Client-Id": CLIENT_ID,
//         "X-Naver-Client-Secret": CLIENT_SECRET,
//       },
//     });

//     const rawItems = response.data.items;
//     const newItems = rawItems.filter((item) => !collectedLinks.has(item.link));
//     newItems.forEach((item) => collectedLinks.add(item.link));

//     const [thumbnails, crawledResults] = await Promise.all([
//       Promise.all(newItems.map((item) => getThumbnail(item.link))),
//       Promise.all(newItems.map((item) => getArticleTitleAndContent(item.link))),
//     ]);

//     const titles = crawledResults.map((r) => r.title);
//     const contents = crawledResults.map((r) => r.content);

//     let newsItems = mapKrxNews(newItems, thumbnails, contents, titles, crawledResults);
//     newsItems = newsItems.filter((item) => item.content && item.content.trim().length > 0);

//     const domesticAssets = await findAllDomesticAssets();
//     const assetMap = new Map(
//       domesticAssets.map((asset: { name: string; symbol: string }) => [asset.name.trim(), asset.symbol.trim()])
//     );

//     for (const news of newsItems) {
//       const tags: string[] = [];
//       for (const [name, symbol] of Array.from(assetMap.entries())) {
//         if (news.title.includes(name) || news.content.includes(name)) {
//           tags.push(symbol);
//         }
//       }
//       if (tags.length === 0) continue;

//       const newsId = await createNewsWithTags(news, tags);
//       console.log(`✅ 저장 완료 | ID: ${newsId}`);
//       console.log(`📌 제목: ${news.title}`);
//     }

//     console.log("🎉 주식 뉴스 전체 수집 완료");
//   } catch (err) {
//     console.error("❌ 뉴스 수집 중 오류 발생:", err);
//   }
// };

// const getArticleTitleAndContent = async (
//   url: string
// ): Promise<{ title: string; content: string }> => {
//   try {
//     const browser = await puppeteer.launch({
//       headless: true,
//       slowMo: 50,
//       args: [
//         "--no-sandbox",
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--disable-gpu",
//         "--window-size=1920x1080",
//       ],
//     });

//     const page = await browser.newPage();
//     await page.setUserAgent(
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
//     );
//     await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

//     const result = await page.evaluate(() => {
//       const title = document.querySelector("title")?.innerText || "";
//       const article = document.querySelector("article") || document.body;
//       const content = article?.innerText || "";
//       return { title, content };
//     });

//     await browser.close();
//     return {
//       title: result.title.trim(),
//       content: result.content.trim(),
//     };
//   } catch (error) {
//     console.error("❌ Puppeteer 크롤링 오류:", error);
//     return { title: "", content: "" };
//   }
// };

// const getThumbnail = async (url: string): Promise<string | null> => {
//   try {
//     const res = await axios.get<string>(url, { headers: { "User-Agent": "Mozilla/5.0" } });
//     const $ = cheerio.load(res.data);
//     return $("meta[property='og:image']").attr("content") || null;
//   } catch {
//     console.warn(`⚠️ 썸네일 수집 실패: ${url}`);
//     return null;
//   }
// };

// export const startNewsScheduler = () => {
//   cron.schedule("0 * * * *", async () => {
//     console.log("⏰ 스케줄러 실행 - 뉴스 수집 시작");
//     await fetchAndProcessSmartKrxNews();
//   });
// };
