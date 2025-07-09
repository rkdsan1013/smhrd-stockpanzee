// /frontend/src/components/TickerTape.tsx
import React, { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AssetContext } from "../providers/AssetProvider";
import { fetchAssetPrices, type AssetPrice } from "../services/assetService";
import { fetchFavorites } from "../services/favoriteService";
import Icons from "./Icons";
import TickerItem from "./TickerItem";
import type { Ticker } from "./TickerItem";
import { AuthContext } from "../providers/AuthProvider";

const getCategory = (m: string): "한국" | "해외" | "암호화폐" | "기타" => {
  if (["KOSPI", "KOSDAQ"].includes(m)) return "한국";
  if (["NASDAQ", "NYSE"].includes(m)) return "해외";
  if (m === "Binance") return "암호화폐";
  return "기타";
};

const ITEM_WIDTH = 120; // px
const REFRESH_INTERVAL = 5000; // 5초

const TickerTape: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { staticAssets, ready } = useContext(AssetContext);
  const navigate = useNavigate();

  // 티커 상태
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [flashMap, setFlashMap] = useState<Record<number, "up" | "down" | null>>({});
  const prevPriceRef = useRef<Record<number, number>>({});

  // 즐겨찾기
  const [favIds, setFavIds] = useState<number[]>([]);
  const [showFav, setShowFav] = useState(false);

  // 애니메이션
  const [isPaused, setIsPaused] = useState(false);
  const [repeatTimes, setRepeatTimes] = useState(2);
  const [offset, setOffset] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const tapeInnerRef = useRef<HTMLDivElement>(null);
  const lastTs = useRef<number>(0);

  // 1) 즐겨찾기 ID fetch (인증 사용자만)
  useEffect(() => {
    if (!user) {
      setFavIds([]);
      return;
    }
    fetchFavorites()
      .then(setFavIds)
      .catch(() => setFavIds([]));
  }, [user]);

  // 2) 가격 정보만 5초 간격으로 업데이트
  useEffect(() => {
    if (!ready) return;
    let alive = true;
    let timerId: number;

    const loadLoop = async () => {
      try {
        const prices = await fetchAssetPrices();
        const priceMap = prices.reduce<Record<number, AssetPrice>>((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});

        const newFlash: Record<number, "up" | "down" | null> = {};
        const newTickers: Ticker[] = staticAssets.map((a) => {
          const prev = prevPriceRef.current[a.id];
          const cur = priceMap[a.id]?.currentPrice ?? prev ?? 0;
          if (prev !== undefined && cur !== prev) {
            newFlash[a.id] = cur > prev ? "up" : "down";
          }
          prevPriceRef.current[a.id] = cur;
          return {
            id: a.id,
            name: a.name,
            symbol: a.symbol,
            currentPrice: cur,
            priceChange: priceMap[a.id]?.priceChange ?? 0,
            marketCap: a.marketCap,
            market: a.market,
          };
        });

        if (!alive) return;
        setFlashMap(newFlash);
        setTimeout(() => alive && setFlashMap({}), 800);
        setTickers(newTickers);
      } catch {
        alive && setTickers([]);
      } finally {
        // 다음 루프 예약
        if (alive) {
          timerId = window.setTimeout(loadLoop, REFRESH_INTERVAL);
        }
      }
    };

    loadLoop();
    return () => {
      alive = false;
      clearTimeout(timerId);
    };
  }, [ready]);

  // 3) Top 리스트 메모
  const [koreaTop, globalTop, cryptoTop] = useMemo(() => {
    const k = tickers
      .filter((t) => getCategory(t.market) === "한국")
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 5);
    const g = tickers
      .filter((t) => getCategory(t.market) === "해외")
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 5);
    const c = tickers
      .filter((t) => getCategory(t.market) === "암호화폐")
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 5);
    return [k, g, c] as const;
  }, [tickers]);

  // 4) 즐겨찾기 모드 필터
  const baseTickers = useMemo(() => {
    if (showFav && favIds.length) {
      return tickers.filter((t) => favIds.includes(t.id));
    }
    return [...koreaTop, ...globalTop, ...cryptoTop];
  }, [showFav, favIds, koreaTop, globalTop, cryptoTop, tickers]);

  // 5) repeatTimes 계산 (빈 배열 방어)
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (baseTickers.length === 0) {
      setRepeatTimes(2);
      return;
    }
    const cw = containerRef.current.clientWidth;
    const baseWidth = baseTickers.length * ITEM_WIDTH;
    const times = Math.ceil((cw * 2) / baseWidth);
    setRepeatTimes(Math.max(2, times));
  }, [baseTickers]);

  const safeRepeatTimes = Number.isFinite(repeatTimes) ? repeatTimes : 2;

  // 6) displayTickers
  const displayTickers = useMemo(
    () => Array(safeRepeatTimes).fill(baseTickers).flat(),
    [safeRepeatTimes, baseTickers],
  );

  // 7) tapeWidth 계산
  const [tapeWidth, setTapeWidth] = useState(0);
  useEffect(() => {
    if (!tapeInnerRef.current) return;
    setTapeWidth(tapeInnerRef.current.scrollWidth / safeRepeatTimes);
  }, [displayTickers, safeRepeatTimes]);

  // 8) 애니메이션
  useEffect(() => {
    let running = true;
    const speed = 30;
    if (!displayTickers.length || tapeWidth === 0) {
      setOffset(0);
      return () => {
        running = false;
      };
    }
    function step(ts: number) {
      if (!running) return;
      if (!isPaused) {
        const dt = ts - lastTs.current;
        setOffset((prev) => {
          let next = prev - (dt * speed) / 1000;
          if (-next >= tapeWidth) next = 0;
          return next;
        });
      }
      lastTs.current = ts;
      requestAnimationFrame(step);
    }
    lastTs.current = performance.now();
    requestAnimationFrame(step);
    return () => {
      running = false;
    };
  }, [isPaused, tapeWidth, displayTickers.length]);

  return (
    <div
      ref={containerRef}
      className="fixed left-0 right-0 bottom-0 w-screen z-[99] bg-[#161b22] border-t border-gray-800 overflow-hidden flex items-center"
      style={{ height: 48, minHeight: 40, boxShadow: "0 -2px 6px rgba(0,0,0,0.15)" }}
    >
      {/* 즐겨찾기 토글 */}
      <div
        className="flex items-center justify-center h-full"
        style={{
          width: 48,
          background: "rgba(22,27,34,0.95)",
          borderRight: "1.5px solid #222",
          zIndex: 50,
        }}
      >
        <button
          onClick={() => setShowFav((v) => !v)}
          className="w-full h-full flex items-center justify-center"
          aria-label="즐겨찾기 모드"
        >
          <Icons
            name="banana"
            className={`w-7 h-7 ${showFav ? "text-yellow-400" : "text-gray-400"}`}
          />
        </button>
      </div>

      {/* ticker tape */}
      <div className="relative flex-1 h-full overflow-hidden">
        <div
          ref={tapeInnerRef}
          className="inline-flex items-center h-full"
          style={{
            whiteSpace: "nowrap",
            transform: `translateX(${offset}px)`,
            transition: isPaused ? "none" : undefined,
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {displayTickers.length === 0 ? (
            <span className="text-gray-400 px-8">표시할 종목이 없습니다.</span>
          ) : (
            displayTickers.map((t, i) => (
              <TickerItem
                key={`${t.id}-${i}`}
                ticker={t}
                flash={flashMap[t.id]}
                onClick={(id) => navigate(`/asset/${id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TickerTape);
