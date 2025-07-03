// /frontend/src/pages/News.tsx
import React, { useState, useEffect, useRef } from "react";
import type { NewsItem } from "../services/newsService";
import { fetchNews } from "../services/newsService";
import NewsCard from "../components/NewsCard";
import SkeletonCard from "../components/SkeletonCard";
import Icons from "../components/Icons";
import { fetchFavorites } from "../services/favoriteService";
import { fetchAssets, type Asset } from "../services/assetService";
import { AuthContext } from "../providers/AuthProvider";

const tabs = [
  { key: "all", label: "전체" },
  { key: "domestic", label: "국내" },
  { key: "international", label: "해외" },
  { key: "crypto", label: "암호화폐" },
  { key: "favorites", label: "즐겨찾기" },
] as const;

type TabKey = (typeof tabs)[number]["key"];
// 한 줄에 3개씩 로드
const itemsPerPage = 3;

const News: React.FC = () => {
  const { user } = React.useContext(AuthContext);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabKey>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

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
    fetchFavorites().then(setFavorites).catch(() => setFavorites([]));
    fetchAssets().then(setAssets).catch(() => setAssets([]));
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTab]);

    // id → symbol 맵핑
  const favoriteSymbols = React.useMemo(() => {
    if (!favorites.length || !assets.length) return [];
    // favorites: number[] (assetId)
    // assets: Asset[] (id, symbol, ...)
    return favorites
      .map(fid => assets.find(a => a.id === fid)?.symbol)
      .filter((s): s is string => !!s);
  }, [favorites, assets]);

 
    // 기존 필터 확장
  const filtered =
    selectedTab === "all"
      ? newsItems
      : selectedTab === "favorites"
        ? newsItems.filter((n) => {
            // 태그가 없는 경우 제외
            if (!n.tags) return false;
            let tags: string[] = [];
            try {
              tags = Array.isArray(n.tags) ? n.tags : JSON.parse(n.tags);
            } catch { return false; }
            // favoriteSymbols 중 하나라도 tags에 포함
            return tags.some((t) => favoriteSymbols.includes(t));
          })
        : newsItems.filter((n) => n.category === selectedTab);

  const visibleNews = filtered.slice(0, currentPage * itemsPerPage);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && visibleNews.length < filtered.length) {
          setCurrentPage((p) => p + 1);
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(loadMoreRef.current);
    return () => io.disconnect();
  }, [visibleNews, filtered]);

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

    const handleTabClick = (key: TabKey) => {
      if (key === "favorites" && !user) {
        alert("즐겨찾기 종목 뉴스는 로그인 후 확인할 수 있습니다.");
        return;
      }
      setSelectedTab(key);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };


  return (
    <section className="container mx-auto px-4 py-8">
      {/* 헤더 + 탭 */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-white">최신 뉴스</h1>
        <nav className="mt-4 sm:mt-0">
          <ul className="flex space-x-4">
            {tabs.map((t) => (
              <li key={t.key}>
                <button
                  onClick={() => handleTabClick(t.key)}
                  className={`
                    text-sm font-medium pb-2
                    ${
                      selectedTab === t.key
                        ? "border-b-2 border-blue-500 text-white"
                        : "text-gray-400 hover:text-white hover:border-gray-600"
                    }
                  `}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      {/* 로딩 스켈레톤 */}
      {loading && (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {Array.from({ length: itemsPerPage }).map((_, i) => (
            <li key={i}>
              <SkeletonCard />
            </li>
          ))}
        </ul>
      )}

      {/* 에러 */}
      {!loading && error && (
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

      {/* 결과 없음 */}
      {!loading && !error && visibleNews.length === 0 && (
        <div className="text-center text-gray-300">조건에 맞는 뉴스가 없습니다.</div>
      )}

      {/* 뉴스 카드 그리드 */}
      {!loading && !error && visibleNews.length > 0 && (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {visibleNews.map((item) => (
              <li key={item.id}>
                <NewsCard newsItem={item} />
              </li>
            ))}
          </ul>

          {/* 무한 스크롤 로딩 표시 */}
          {visibleNews.length < filtered.length && (
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
          aria-label="Scroll to top"
        >
          <Icons name="arrowUpCircle" />
        </button>
      )}
    </section>
  );
};

export default News;
