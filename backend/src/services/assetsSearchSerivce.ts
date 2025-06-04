import pool from "../config/db";

export const searchAssets = async (query: string, category?: string) => {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  // 1. 카테고리에 따른 market 목록 설정
  let markets: string[] = [];
  if (category === "domestic") markets = ["KOSPI", "KOSDAQ"];
  else if (category === "global") markets = ["NASDAQ", "NYSE"];
  else if (category === "crypto") markets = ["Binance"];
  // category가 없거나 빈 문자열("")이면 전체 마켓에서 검색

  // 2. 검색어 기반으로 비교에 사용할 패턴들 정의
  //    nameExact, symbolExact: 완전 일치
  //    namePrefix, symbolPrefix: 접두어(‘trimmed%’)
  //    nameContains, symbolContains: 포함(‘%trimmed%’)
  const nameExact = trimmed;
  const symbolExact = trimmed;
  const namePrefix = `${trimmed}%`;
  const symbolPrefix = `${trimmed}%`;
  const nameContains = `%${trimmed}%`;
  const symbolContains = `%${trimmed}%`;

  // 3. WHERE 절: 이름/심볼에 대해 “포함(contains)” 수준으로 필터링
  let sql = `
    SELECT id, symbol, name, market
    FROM assets
    WHERE (
      LOWER(name) LIKE ? OR
      LOWER(symbol) LIKE ?
    )
  `;
  const params: any[] = [nameContains, symbolContains];

  // 4. market 필터 조건 추가 (있으면)
  if (markets.length > 0) {
    const placeholders = markets.map(() => "?").join(", ");
    sql += ` AND market IN (${placeholders})`;
    params.push(...markets);
  }

  // 5. ORDER BY 절: “유사도”를 좀 더 세분화해서 매김
  //
  //   ①  이름이 정확히 일치(LOWER(name) = trimmed) → 0
  //   ②  심볼이 정확히 일치(LOWER(symbol) = trimmed) → 1
  //   ③  이름이 접두어 일치(LOWER(name) LIKE 'trimmed%') → 2
  //   ④  이름 내부에 들어간 위치가 빠른 순서(LOCATE(trimmed, LOWER(name))) → 3
  //   ⑤  심볼이 접두어 일치(LOWER(symbol) LIKE 'trimmed%') → 4
  //   ⑥  심볼 내부에 들어간 위치가 빠른 순서(LOCATE(trimmed, LOWER(symbol))) → 5
  //   ⑦  나머지(기타) → 6
  //
  sql += `
    ORDER BY
      CASE
        WHEN LOWER(name) = ? THEN 0
        WHEN LOWER(symbol) = ? THEN 1
        WHEN LOWER(name) LIKE ? THEN 2
        WHEN LOCATE(?, LOWER(name)) > 0 THEN 3
        WHEN LOWER(symbol) LIKE ? THEN 4
        WHEN LOCATE(?, LOWER(symbol)) > 0 THEN 5
        ELSE 6
      END,
      -- 동일한 순위 내에서는 name 오름차순
      name ASC
    LIMIT 30
  `;

  // 6. ORDER BY CASE에 대응하는 파라미터들을 순서대로 추가
  params.push(
    nameExact, // LOWER(name) = trimmed
    symbolExact, // LOWER(symbol) = trimmed
    namePrefix, // LOWER(name) LIKE 'trimmed%'
    trimmed, // LOCATE(trimmed, LOWER(name))
    symbolPrefix, // LOWER(symbol) LIKE 'trimmed%'
    trimmed, // LOCATE(trimmed, LOWER(symbol))
  );

  // 7. 쿼리 실행
  const [rows] = await pool.query(sql, params);
  return rows;
};
