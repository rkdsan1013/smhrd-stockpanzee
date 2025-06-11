import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import fs from 'fs';

const getTickersByMarket = async (marketType: 'KOSPI' | 'KOSDAQ'): Promise<string[]> => {
  const tickers: string[] = [];
  const sosok = marketType === 'KOSPI' ? 0 : 1;

  let page = 1;
  while (true) {
    const url = `https://finance.naver.com/sise/sise_market_sum.naver?sosok=${sosok}&page=${page}`;
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const decoded = iconv.decode(res.data, 'euc-kr');
    const $ = cheerio.load(decoded);

    let found = false;
    $('table.type_2 tbody tr').each((_, el) => {
      const href = $(el).find('td a').attr('href');
      const match = href?.match(/code=(\d+)/);
      if (match) {
        tickers.push(match[1]);
        found = true;
      }
    });

    if (!found) break;
    page++;
  }

  return Array.from(new Set(tickers));
};

const getStockInfo = async (code: string, market: 'KOSPI' | 'KOSDAQ') => {
  const url = `https://finance.naver.com/item/main.nhn?code=${code}`;
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const decoded = iconv.decode(res.data, 'euc-kr');
    const $ = cheerio.load(decoded);

    const name = $('.wrap_company h2').text().trim();

    return {
      symbol: code,
      name,
      market
    };
  } catch (e) {
    console.error(`❌ 오류 (${market}): ${code}`);
    return null;
  }
};

const main = async () => {
  const finalResults: { symbol: string; name: string; market: string }[] = [];

  const markets: ('KOSPI' | 'KOSDAQ')[] = ['KOSPI', 'KOSDAQ'];
  for (const marketType of markets) {
    console.log(`📥 ${marketType} 수집 중...`);
    const tickers = await getTickersByMarket(marketType);
    console.log(`🔢 종목 수: ${tickers.length}`);

    const batchSize = 10;
    for (let i = 0; i < tickers.length; i += batchSize) {
      const batch = tickers.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((code) => getStockInfo(code, marketType))
      );
      finalResults.push(...(batchResults.filter(Boolean) as typeof finalResults));
    }
  }

  fs.writeFileSync('krx_basic_info.json', JSON.stringify(finalResults, null, 2), 'utf-8');
  console.log(`✅ 총 ${finalResults.length}개 종목 저장 완료!`);
};

main();