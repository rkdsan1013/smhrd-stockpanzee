import axios from 'axios';
import * as cheerio from 'cheerio';
import * as iconv from 'iconv-lite';

interface StockInfo {
  시가총액: string;
  산업: string;
  투자지표: Record<string, string>;
}

async function getStockInfo(stockCode: string): Promise<StockInfo> {
  const url = `https://finance.naver.com/item/main.nhn?code=${stockCode}`;
  const headers = { 'User-Agent': 'Mozilla/5.0' };

  const res = await axios.get(url, {
    headers,
    responseType: 'arraybuffer', // HTML 바이너리로 받기
  });

  const decodedData = iconv.decode(res.data, 'euc-kr');
  const $ = cheerio.load(decodedData);

  const data: StockInfo = {
    시가총액: 'N/A',
    산업: stockCode,
    투자지표: {},
  };

  // ✅ 산업 정보
  const sector = $('.description span').first().text().trim();
  if (sector) {
    data.산업 = sector;
  }

  // ✅ 시가총액 (보다 확실한 방식)
  $('table.no_info tr').each((_, row) => {
    const label = $(row).find('th').text().trim();
    if (label.includes('시가총액')) {
      const value = $(row).find('td em span.blind').first().text().trim();
      if (value) {
        data.시가총액 = value;
      }
    }
  });

  // ✅ 투자지표 (줄바꿈, 탭 제거)
  $('.per_table tr').each((_, row) => {
    const th = $(row).find('th').text().trim().replace(/\s+/g, ' ');
    const td = $(row).find('td').text().trim().replace(/\s+/g, ' ');
    if (th && td) {
      data.투자지표[th] = td;
    }
  });

  return data;
}

// 테스트 실행
getStockInfo('005930') // 삼성전자
  .then(info => {
    console.log(info);
  })
  .catch(err => {
    console.error('에러 발생:', err);
  });
