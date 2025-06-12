// /frontend/src/components/SearchResults.tsx
import { useState, useEffect } from "react";
import type { FC } from "react";
import type { Asset } from "../services/assetService";
import { fetchAssets } from "../services/assetService";

interface SearchResultsProps {
  searchTerm: string;
}

// 검색어와 자산 간 관련성 점수를 계산하는 함수
const getMatchScore = (asset: Asset, query: string): number => {
  let score = 0;
  const lowerQuery = query.toLowerCase();
  const symbol = asset.symbol.toLowerCase();
  const name = asset.name.toLowerCase();

  // 이름과 심볼이 검색어로 시작하는 경우 높은 점수 추가
  if (symbol.startsWith(lowerQuery)) score += 3;
  if (name.startsWith(lowerQuery)) score += 3;

  // 이름과 심볼에 검색어가 포함되면 점수 추가
  if (symbol.includes(lowerQuery)) score += 1;
  if (name.includes(lowerQuery)) score += 1;

  return score;
};

const SearchResults: FC<SearchResultsProps> = ({ searchTerm }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAssets()
      .then((list) => setAssets(list))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!searchTerm.trim()) return null;

  // 관련성 점수를 기준으로 정렬
  const lower = searchTerm.toLowerCase();
  const results = assets
    .filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(lower) || asset.name.toLowerCase().includes(lower),
    )
    .sort((a, b) => getMatchScore(b, searchTerm) - getMatchScore(a, searchTerm));

  return (
    <div
      className="
        absolute top-full left-0 right-0 mt-2 
        bg-white text-black rounded-lg shadow-lg z-20 
        p-2 flex flex-col gap-2 transition-all duration-300 
        max-h-60 overflow-y-auto
      "
    >
      {loading ? (
        <div className="px-4 py-2 text-gray-500">로딩 중...</div>
      ) : results.length > 0 ? (
        results.map((asset) => (
          <div
            key={asset.id}
            onClick={() => alert(`Clicked: ${asset.symbol} – ${asset.name}`)}
            className="
              px-4 py-2 rounded-lg 
              hover:bg-gray-100 hover:shadow 
              transition-all duration-200 
              cursor-pointer
            "
          >
            <div className="font-semibold text-gray-900">
              {asset.symbol} – {asset.name}
            </div>
            <div className="text-sm text-gray-500">{asset.market}</div>
          </div>
        ))
      ) : (
        <div className="px-4 py-2 text-gray-500">검색 결과가 없습니다.</div>
      )}
    </div>
  );
};

export default SearchResults;
