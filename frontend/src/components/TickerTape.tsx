// /frontend/src/components/TickerTape.tsx
// cspell:ignore KOSPI KOSDAQ NASDAQ NYSE Binance
import React, { useEffect, useLayoutEffect, useRef, useState, useContext, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../providers/AuthProvider";
import { fetchFavorites } from "../services/favoriteService";
import Icons from "./Icons";
import TickerItem from "./TickerItem";
import type { Ticker } from "./TickerItem";

const fetchTickers = async (): Promise<Ticker[]> => {
  const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/assets`);
  return (res.data as any[]).map((t) => ({
    id: t.id,
    name: t.name,
    symbol: t.symbol,
    currentPrice: t.currentPrice ?? t.current_price ?? 0,
    priceChange: t.priceChange ?? t.price_change ?? 0,
    marketCap: t.marketCap ?? t.market_cap ?? 0,
    market: t.market,
  }));
};

const getCategory = (m: string): "한국" | "해외" | "암호화폐" | "기타" => {
  if (["KOSPI", "KOSDAQ"].includes(m)) return "한국";
  if (["NASDAQ", "NYSE"].includes(m)) return "해외";
  if (["Binance"].includes(m)) return "암호화폐";
  return "기타";
};

const ITEM_WIDTH = 120; // px

const TickerTape: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [flashMap, setFlashMap] = useState<Record<number, "up" | "down" | null>>({});
  const [prevPrice, setPrevPrice] = useState<Record<number, number>>({});
  const [favIds, setFavIds] = useState<number[]>([]);
  const [showFav, setShowFav] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [repeatTimes, setRepeatTimes] = useState(2);
  const [offset, setOffset] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const tapeInnerRef = useRef<HTMLDivElement>(null);
  const lastTs = useRef<number>(0);

  // 1) 5초마다 가격 fetch & flash 계산
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await fetchTickers();
        const newFlash: typeof flashMap = {};
        data.forEach((t) => {
          const prev = prevPrice[t.id];
          if (prev !== undefined) {
            newFlash[t.id] = t.currentPrice > prev ? "up" : t.currentPrice < prev ? "down" : null;
          }
        });
        alive && setFlashMap(newFlash);
        setTimeout(() => alive && setFlashMap({}), 800);

        const next = data.reduce(
          (acc, t) => {
            acc[t.id] = t.currentPrice;
            return acc;
          },
          {} as Record<number, number>,
        );

        alive && setPrevPrice(next);
        alive && setTickers(data);
      } catch {
        alive && setTickers([]);
      }
      alive && setTimeout(load, 5000);
    };
    load();
    return () => {
      alive = false;
    };
  }, [prevPrice]);

  // 2) 즐겨찾기 fetch
  useEffect(() => {
    if (!user) {
      setFavIds([]);
      return;
    }
    fetchFavorites()
      .then(setFavIds)
      .catch(() => setFavIds([]));
  }, [user]);

  // 3) Top 리스트 메모
  const [koreaTop, globalTop, cryptoTop] = useMemo(() => {
    const k = [...tickers]
      .filter((t) => getCategory(t.market) === "한국")
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 5);
    const g = [...tickers]
      .filter((t) => getCategory(t.market) === "해외")
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 5);
    const c = [...tickers]
      .filter((t) => getCategory(t.market) === "암호화폐")
      .sort((a, b) => b.marketCap - a.marketCap)
      .slice(0, 5);
    return [k, g, c];
  }, [tickers]);

  // 4) Base tickers
  const baseTickers = useMemo(() => {
    if (showFav && user && favIds.length > 0) {
      return tickers.filter((t) => favIds.includes(t.id));
    }
    return [...koreaTop, ...globalTop, ...cryptoTop];
  }, [showFav, user, favIds, koreaTop, globalTop, cryptoTop, tickers]);

  // 5) repeatTimes 계산 (끊김 없이)
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth || window.innerWidth;
    const baseWidth = (baseTickers.length || 1) * ITEM_WIDTH;
    const times = Math.ceil((cw * 2) / baseWidth);
    setRepeatTimes(Math.max(2, times));
  }, [baseTickers]);

  // 6) displayTickers
  const displayTickers = useMemo(
    () => new Array(repeatTimes).fill(baseTickers).flat(),
    [repeatTimes, baseTickers],
  );

  // 7) tapeWidth 계산
  const [tapeWidth, setTapeWidth] = useState(0);
  useEffect(() => {
    if (!tapeInnerRef.current) return;
    setTapeWidth(tapeInnerRef.current.scrollWidth / repeatTimes);
  }, [displayTickers, repeatTimes]);

  // 8) 애니메이션 (마우스 호버 시 isPaused = true, 내부에서 체크하여 멈춤)
  useEffect(() => {
    let running = true;
    const speed = 30;

    if (displayTickers.length === 0 || tapeWidth === 0) {
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
      style={{
        height: 48,
        minHeight: 40,
        boxShadow: "0 -2px 6px rgba(0,0,0,0.15)",
      }}
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
