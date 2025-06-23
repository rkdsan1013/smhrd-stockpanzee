import puppeteer from "puppeteer";

export const extractFullContentWithPuppeteer = async (url: string): Promise<string | null> => {
  try {
    const browser = await puppeteer.launch({ headless: true }); // 타입 호환 보장
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });

    const content = await page.evaluate(() => {
      const article = document.querySelector("article") || document.body;
      return article?.innerText || "";
    });

    await browser.close();
    return content.trim() || null;
  } catch (error) {
    console.error("Puppeteer 크롤링 오류:", error);
    return null;
  }
};
