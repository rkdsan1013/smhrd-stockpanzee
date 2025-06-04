import type { FC } from "react";

interface Asset {
  id: number;
  symbol: string;
  name: string;
  market: string;
}

// 임시 더미 데이터
const dummyAssets: Asset[] = [
  { id: 1, symbol: "AAPL", name: "Apple Inc.", market: "NASDAQ" },
  { id: 2, symbol: "BTC", name: "Bitcoin", market: "Binance" },
  { id: 3, symbol: "ETH", name: "Ethereum", market: "Binance" },
  { id: 4, symbol: "GOOGL", name: "Alphabet Inc.", market: "NASDAQ" },
];

interface SearchResultsProps {
  searchTerm: string;
}

const SearchResults: FC<SearchResultsProps> = ({ searchTerm }) => {
  if (!searchTerm.trim()) return null;

  // 더미 데이터 필터링
  const results = dummyAssets.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white text-black rounded-lg shadow-lg z-20 p-2 flex flex-col gap-2 transition-all duration-300">
      {results.length > 0 ? (
        results.map((asset) => (
          <div
            key={asset.id}
            className="px-4 py-2 rounded-lg hover:bg-gray-100 hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            <div className="font-semibold text-gray-900">
              {asset.symbol} - {asset.name}
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
