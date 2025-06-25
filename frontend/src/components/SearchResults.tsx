// /frontend/src/components/SearchResults.tsx
import { useState, useEffect } from "react";
import type { FC } from "react";
import Fuse from "fuse.js";
import type { Asset } from "../services/assetService";
import { fetchAssets } from "../services/assetService";
import { FixedSizeList as List } from "react-window";
import type { ListChildComponentProps } from "react-window";

interface SearchResultsProps {
  searchTerm: string;
}

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

  // Fuse.js 옵션 설정: symbol과 name 필드에서 검색
  const fuseOptions = {
    keys: ["symbol", "name"],
    threshold: 0.3, // 0.0: 완벽한 일치, 1.0: 모든 결과 허용 (0.3은 꽤 엄격한 설정)
    // includeScore: true, // 필요에 따라 점수를 포함할 수 있음
  };

  const fuse = new Fuse(assets, fuseOptions);
  const fuseResults = fuse.search(searchTerm);
  const results = fuseResults.map((result) => result.item);

  return (
    <div
      className="
        absolute top-full left-0 right-0 mt-2  
        bg-white text-black rounded-lg shadow-lg z-20 overflow-hidden
        transition-all duration-300
      "
    >
      <div className="bg-white text-black p-2">
        {loading ? (
          <div className="px-4 py-2 text-gray-500">로딩 중...</div>
        ) : results.length > 0 ? (
          <List
            height={240} //  최대 높이 15rem (240px) 정도로 설정 (Tailwind의 max-h-60과 동일)
            itemCount={results.length}
            itemSize={60} // 각 아이템의 높이 (디자인에 맞게 조정)
            width="100%"
          >
            {({ index, style }: ListChildComponentProps) => {
              const asset = results[index];
              return (
                <div
                  style={style}
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
