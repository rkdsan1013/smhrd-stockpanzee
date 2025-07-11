// frontend/src/pages/News.tsx
import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import type { NewsItem } from "../services/newsService";
import { fetchNews } from "../services/newsService";
import NewsCard from "../components/NewsCard";
import NewsSkeleton from "../components/skeletons/NewsSkeleton";
import Icons from "../components/Icons";
import { fetchFavorites } from "../services/favoriteService";
import { fetchAssets, type Asset } from "../services/assetService";
import { AuthContext } from "../providers/AuthProvider";
import { fuzzySearch } from "../utils/search";

const tabOptions = [
  { key: "all", label: "전체" },
  { key: "domestic", label: "국내" },
  { key: "international", label: "해외" },
  { key: "crypto", label: "암호화폐" },
] as const;
type TabKey = (typeof tabOptions)[number]["key"];
const itemsPerPage = 3;

const News: React.FC = () => {
  const { user } = useContext(AuthContext);

  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabKey>("all");
  const [viewMode, setViewMode] = useState<"전체" | "즐겨찾기">("전체");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [showTopBtn, setShowTopBtn] = useState(false);

  // 1. 전체 뉴스 조회
  const loadNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNews();
      setNewsItems(data);
    } catch (err: any) {
      setError(err.message || "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadNews();
  }, []);

  // 2. 즐겨찾기 ID, 자산(symbol) 조회
  useEffect(() => {
    if (!user) {
      setFavorites([]);
      setAssets([]);
      return;
    }
    fetchFavorites()
      .then(setFavorites)
      .catch(() => setFavorites([]));
    fetchAssets()
      .then(setAssets)
      .catch(() => setAssets([]));
  }, [user]);

  // 3. 필터/검색/탭 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, viewMode, searchTerm]);

  // 4. favorites → symbol 배열
  const favoriteSymbols = useMemo(() => {
    if (!favorites.length || !assets.length) return [];
    return favorites
      .map((fid) => assets.find((a) => a.id === fid)?.symbol)
      .filter((s): s is string => Boolean(s));
  }, [favorites, assets]);

  // 5. 필터링 & 정렬
  const filteredNews = useMemo(() => {
    let list = [...newsItems];

    // 5-1. 카테고리 필터
    if (selectedTab !== "all") {
      list = list.filter((n) => n.category === selectedTab);
    }

    // 5-2. 검색어 필터: title_ko 및 summary
    if (searchTerm.trim()) {
      list = fuzzySearch(list, searchTerm, {
        keys: ["title_ko", "summary"],
      });
    }

    // 5-3. 즐겨찾기 뷰 필터
    if (viewMode === "즐겨찾기") {
      list = list.filter((n) => {
        let tags: string[] = [];
        try {
          tags = Array.isArray(n.tags) ? n.tags : JSON.parse(n.tags);
        } catch {
          return false;
        }
        return tags.some((t) => favoriteSymbols.includes(t));
      });
    }

    // 5-4. 최신순 정렬
    list.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    return list;
  }, [newsItems, selectedTab, searchTerm, viewMode, favoriteSymbols]);

  // 6. 페이지네이션 (infinite scroll)
  const visibleNews = useMemo(
    () => filteredNews.slice(0, currentPage * itemsPerPage),
    [filteredNews, currentPage],
  );

  // 7. IntersectionObserver로 추가 로드
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleNews.length < filteredNews.length) {
          setCurrentPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [visibleNews, filteredNews]);

  // 8. 스크롤 위치에 따라 맨위 버튼 표시
  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 9. UI 핸들러
  const handleTabClick = (key: TabKey) => {
    setSelectedTab(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleView = () => {
    if (!user) {
      alert("즐겨찾기 뉴스는 로그인 후 확인 가능합니다.");
      return;
    }
    setViewMode((v) => (v === "전체" ? "즐겨찾기" : "전체"));
  };

  if (loading) {
    return <NewsSkeleton itemsPerPage={itemsPerPage} />;
  }

  return (
    <section className="container mx-auto px-4 py-8">
      {/* 네비게이션 + 검색 */}
      <nav className="flex items-center justify-between mb-8">
        <ul className="flex space-x-6 border-b border-gray-700">
          <li>
            <button
              onClick={toggleView}
              className={`px-4 py-2 -mb-px transition-colors ${
                viewMode === "즐겨찾기"
                  ? "text-yellow-400 border-b-2 border-yellow-400"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icons name="banana" className="w-5 h-5" />
            </button>
          </li>
          {tabOptions.map((t) => (
            <li key={t.key}>
              <button
                onClick={() => handleTabClick(t.key)}
                className={`px-4 py-2 -mb-px text-sm font-medium transition-colors ${
                  selectedTab === t.key
                    ? "text-white border-b-2 border-blue-500"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="relative w-48 md:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="뉴스 검색..."
            className="w-full bg-gray-800 text-white placeholder-gray-500
                       rounded-full px-3 py-2 pr-8 outline-none
                       focus:ring-2 focus:ring-blue-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              aria-label="검색어 지우기"
            >
              <Icons name="x" className="w-4 h-4" />
            </button>
          )}
        </div>
      </nav>

      {/* 에러 메시지 */}
      {error && (
        <div className="text-center text-red-400 mb-8">
          <p className="mb-4">오류: {error}</p>
          <button
            onClick={loadNews}
            className="inline-flex items-center px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 text-white"
          >
            <Icons name="refreshCw" className="mr-2 w-5 h-5" />
            다시 시도
          </button>
        </div>
      )}

      {/* 결과 없음 */}
      {!error && visibleNews.length === 0 && (
        <div className="text-center text-gray-300 py-12">조건에 맞는 뉴스가 없습니다.</div>
      )}

      {/* 뉴스 카드 목록 */}
      {!error && visibleNews.length > 0 && (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleNews.map((item) => (
              <li key={item.id}>
                <NewsCard newsItem={item} />
              </li>
            ))}
          </ul>

          {visibleNews.length < filteredNews.length && (
            <div ref={loadMoreRef} className="mt-8 flex justify-center items-center text-gray-500">
              로딩 중...
            </div>
          )}
        </>
      )}

      {/* 맨 위로 버튼 */}
      {showTopBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 text-4xl text-blue-500 hover:text-blue-400 transition"
          aria-label="맨 위로"
        >
          <Icons name="arrowUpCircle" />
        </button>
      )}
    </section>
  );
};

export default News;
