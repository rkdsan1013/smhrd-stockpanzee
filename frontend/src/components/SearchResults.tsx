// /frontend/src/components/SearchResults.tsx
import { useState, useEffect } from "react";
import type { FC } from "react";
import { FixedSizeList as List } from "react-window";
import type { ListChildComponentProps } from "react-window";
import { fetchAssets } from "../services/assetService";
import type { Asset } from "../services/assetService";
import { fuzzySearch } from "../utils/search";

interface SearchResultsProps {
  searchTerm: string;
}

const SearchResults: FC<SearchResultsProps> = ({ searchTerm }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchAssets()
      .then(setAssets)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // 검색어가 없으면 숨김
  if (!searchTerm.trim()) return null;

  // fuzzySearch 호출: keys, threshold 등 옵션만 넘기면 끝
  const results = fuzzySearch<Asset>(assets, searchTerm, {
    keys: ["symbol", "name"],
    threshold: 0.3,
  });

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white text-black rounded-lg shadow-lg z-20 overflow-hidden">
      <div className="p-2">
        {loading ? (
          <div className="px-4 py-2 text-gray-500">로딩 중...</div>
        ) : results.length > 0 ? (
          <List height={240} itemCount={results.length} itemSize={60} width="100%">
            {({ index, style }: ListChildComponentProps) => {
              const asset = results[index];
              return (
                <div
                  key={asset.id}
                  style={style}
                  onClick={() => alert(`Clicked: ${asset.symbol} – ${asset.name}`)}
                  className="px-4 py-2 rounded-lg hover:bg-gray-100 hover:shadow cursor-pointer"
                >
                  <div className="font-semibold text-gray-900">
                    {asset.symbol} – {asset.name}
                  </div>
                  <div className="text-sm text-gray-500">{asset.market}</div>
                </div>
              );
            }}
          </List>
        ) : (
          <div className="px-4 py-2 text-gray-500">검색 결과가 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
