// /frontend/src/pages/News.tsx
import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import type { NewsItem } from "../services/newsService";
import { fetchNews } from "../services/newsService";
import NewsCard from "../components/NewsCard";
import NewsSkeleton from "../components/skeletons/NewsSkeleton";
import Icons from "../components/Icons";
import { fetchFavorites } from "../services/favoriteService";
import { fetchAssets, type Asset } from "../services/assetService";
import { AuthContext } from "../providers/AuthProvider";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [showTopBtn, setShowTopBtn] = useState(false);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab, viewMode]);

  const favoriteSymbols = useMemo(() => {
    if (!favorites.length || !assets.length) return [];
    return favorites
      .map((fid) => assets.find((a) => a.id === fid)?.symbol)
      .filter((s): s is string => Boolean(s));
  }, [favorites, assets]);

  const filteredNews = useMemo(() => {
    let filtered = newsItems;
    if (selectedTab !== "all") {
      filtered = filtered.filter((n) => n.category === selectedTab);
    }
    if (viewMode === "즐겨찾기") {
      filtered = filtered.filter((n) => {
        if (!n.tags) return false;
        let tags: string[] = [];
        try {
          tags = Array.isArray(n.tags) ? n.tags : JSON.parse(n.tags);
        } catch {
          return false;
        }
        return tags.some((t) => favoriteSymbols.includes(t));
      });
    }
    return filtered;
  }, [newsItems, selectedTab, viewMode, favoriteSymbols]);

  const visibleNews = useMemo(
    () => filteredNews.slice(0, currentPage * itemsPerPage),
    [filteredNews, currentPage],
  );

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleNews.length < filteredNews.length) {
          setCurrentPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(loadMoreRef.current);
    return () => io.disconnect();
  }, [visibleNews, filteredNews]);

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleTabClick = (key: TabKey) => {
    setSelectedTab(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleView = () => {
    if (!user) {
      alert("즐겨찾기 종목 뉴스는 로그인 후 확인할 수 있습니다.");
      return;
    }
    setViewMode((prev) => (prev === "전체" ? "즐겨찾기" : "전체"));
  };

  if (loading) {
    return <NewsSkeleton itemsPerPage={itemsPerPage} />;
  }

  return (
    <section className="container mx-auto px-4 py-8">
      {/* Market 스타일 상단 탭 */}
      <nav className="overflow-x-auto flex justify-start mb-8">
        <ul className="flex space-x-6 border-b border-gray-700">
          <li>
            <button
              onClick={toggleView}
              className={`px-4 py-2 -mb-px cursor-pointer transition-colors ${
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
                className={`px-4 py-2 -mb-px text-sm font-medium cursor-pointer transition-colors ${
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
      </nav>

      {/* 에러 처리 */}
      {error && (
        <div className="text-center text-red-400">
          <p className="mb-4">오류가 발생했습니다: {error}</p>
          <button
            onClick={loadNews}
            className="inline-flex items-center px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 text-white"
          >
            <Icons name="refreshCw" className="mr-2 w-5 h-5" />
            다시 시도
          </button>
        </div>
      )}

      {/* 조건에 맞는 뉴스 없음 */}
      {!error && visibleNews.length === 0 && (
        <div className="text-center text-gray-300">조건에 맞는 뉴스가 없습니다.</div>
      )}

      {/* 뉴스 카드 목록 */}
      {!error && visibleNews.length > 0 && (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {visibleNews.map((item) => (
              <li key={item.id}>
                <NewsCard newsItem={item} />
              </li>
            ))}
          </ul>

          {/* 무한 스크롤 로딩 */}
          {visibleNews.length < filteredNews.length && (
            <div ref={loadMoreRef} className="mt-8 flex justify-center items-center text-gray-500">
              로딩 중...
            </div>
          )}
        </>
      )}

      {/* 최상단 이동 버튼 */}
      {showTopBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 text-4xl text-blue-500 hover:text-blue-400 transition"
          aria-label="Scroll to top"
        >
          <Icons name="arrowUpCircle" />
        </button>
      )}
    </section>
  );
};

export default News;
