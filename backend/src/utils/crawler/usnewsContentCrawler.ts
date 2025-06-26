import * as puppeteer from "puppeteer";

export const extractFullContentWithPuppeteer = async (url: string): Promise<string | null> => {
  let browser: puppeteer.Browser | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });

    const content = await page.evaluate(() => {
      const article = document.querySelector("article") || document.body;
      return article?.innerText || "";
    });

    return content.trim() || null;
  } catch (error) {
    console.error("Puppeteer 크롤링 오류:", error);
    return null;
  } finally {
    if (browser) await browser.close();
  }
};
