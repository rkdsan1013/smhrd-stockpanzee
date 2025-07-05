// /frontend/src/components/TickerTape.tsx
// cspell:ignore KOSPI KOSDAQ NASDAQ NYSE S&P500 Binance Upbit
import React, { useEffect, useRef, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../providers/AuthProvider";
import { fetchFavorites } from "../services/favoriteService";
import Icons from "../components/Icons";

type Ticker = {
  id: number;
  name: string;
  symbol: string;
  currentPrice: number;
  priceChange: number;
  marketCap: number;
  market: string;
};

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

const getCategory = (market: string): "한국" | "해외" | "암호화폐" | "기타" => {
  if (["KOSPI", "KOSDAQ", "KRX"].includes(market)) return "한국";
  if (["NASDAQ", "NYSE", "S&P500"].includes(market)) return "해외";
  if (["Binance", "Upbit"].includes(market)) return "암호화폐";
  return "기타";
};

function TickerTape() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [prevTickers, setPrevTickers] = useState<Record<number, Ticker>>({});
  const [flashStates, setFlashStates] = useState<Record<number, "up" | "down" | null>>({});
  const [showFav, setShowFav] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [offset, setOffset] = useState(0);
  const [repeatTimes, setRepeatTimes] = useState(2);
  const [tapeWidth, setTapeWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const tapeInnerRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<number | null>(null);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const speed = 30; // px per second

  // 1) 5초마다 시세 불러오기
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchTickers();
        setTickers(data);
      } catch {
        setTickers([]);
      }
      if (active) setTimeout(load, 5000);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  // 2) 이전 가격과 비교해서 flash 상태 설정
  useEffect(() => {
    const newFlash: Record<number, "up" | "down" | null> = {};
    const timers: number[] = [];

    tickers.forEach((t) => {
      const prev = prevTickers[t.id];
      if (prev) {
        if (t.currentPrice > prev.currentPrice) newFlash[t.id] = "up";
        else if (t.currentPrice < prev.currentPrice) newFlash[t.id] = "down";
        else newFlash[t.id] = null;
      }
    });

    setFlashStates(newFlash);

    Object.entries(newFlash).forEach(([id, state]) => {
      if (state) {
        const timer = window.setTimeout(() => {
          setFlashStates((fs) => ({
            ...fs,
            [Number(id)]: null,
          }));
        }, 800);
        timers.push(timer);
      }
    });

    const map: Record<number, Ticker> = {};
    tickers.forEach((t) => {
      map[t.id] = t;
    });
    setPrevTickers(map);

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [tickers]);

  // 3) 즐겨찾기 불러오기
  useEffect(() => {
    if (user) {
      fetchFavorites()
        .then(setFavorites)
        .catch(() => setFavorites([]));
    } else {
      setFavorites([]);
    }
  }, [user]);

  // 4) 베이스 티커 목록 결정
  const koreaTop = tickers
    .filter((t) => getCategory(t.market) === "한국")
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 5);
  const globalTop = tickers
    .filter((t) => getCategory(t.market) === "해외")
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 5);
  const cryptoTop = tickers
    .filter((t) => getCategory(t.market) === "암호화폐")
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 5);

  const baseTickers =
    showFav && user && favorites.length > 0
      ? tickers.filter((t) => favorites.includes(t.id))
      : [...koreaTop, ...globalTop, ...cryptoTop];

  // 5) 반복 횟수 계산 (화면 두 배 너비 덮기)
  useEffect(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth || window.innerWidth;
    const itemW = 120; // px, minWidth of one ticker
    const baseW = baseTickers.length * itemW;
    const times = baseW ? Math.ceil((cw * 2) / baseW) : 2;
    setRepeatTimes(Math.max(2, times));
  }, [baseTickers]);

  // 6) 최종 보여줄 목록
  const displayTickers = new Array(repeatTimes).fill(baseTickers).flat();

  // 7) 테이프 너비 계산 (한 사이클)
  useEffect(() => {
    if (!tapeInnerRef.current) return;
    const fullWidth = tapeInnerRef.current.scrollWidth;
    setTapeWidth(fullWidth / repeatTimes);
  }, [displayTickers, repeatTimes]);

  // 8) 애니메이션
  useEffect(() => {
    let running = true;

    function step(ts: number) {
      if (!running) return;
      if (lastTimeRef.current === null) lastTimeRef.current = ts;

      if (!isPaused && tapeWidth > 0) {
        const dt = ts - lastTimeRef.current;
        setOffset((prev) => {
          let next = prev - (dt * speed) / 1000;
          if (-next >= tapeWidth) next = 0;
          return next;
        });
      }
      lastTimeRef.current = ts;
      requestAnimationFrame(step);
    }

    const rafId = requestAnimationFrame(step);
    return () => {
      running = false;
      lastTimeRef.current = null;
      cancelAnimationFrame(rafId);
    };
  }, [isPaused, tapeWidth]);

  return (
    <div
      ref={containerRef}
      className="fixed left-0 right-0 bottom-0 w-screen z-[99] bg-[#161b22] border-t border-gray-800 overflow-hidden flex items-center"
      style={{
        height: 48,
        minHeight: 40,
        boxShadow: "0 -2px 6px rgba(0,0,0,0.15)",
        pointerEvents: "auto",
        fontFamily: "system-ui,sans-serif",
      }}
    >
      {/* 즐겨찾기 토글 */}
      <div
        className="flex items-center justify-center h-full relative"
        style={{
          width: 48,
          minWidth: 48,
          background: "rgba(22,27,34,0.95)",
          borderRight: "1.5px solid #222",
          zIndex: 50,
          pointerEvents: "auto",
        }}
      >
        <button
          onClick={() => setShowFav((v) => !v)}
          className="w-full h-full flex items-center justify-center focus:outline-none"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "2rem",
            transition: "color 0.2s",
            userSelect: "none",
            zIndex: 51,
          }}
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
            minWidth: "100%",
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
            displayTickers.map((ticker, i) => {
              const flash = flashStates[ticker.id];
              const colorClass =
                flash === "up"
                  ? "text-green-300"
                  : flash === "down"
                    ? "text-red-300"
                    : "text-white";

              return (
                <div
                  key={`${ticker.id}-${i}`}
                  className="flex items-center gap-1 px-5 hover:bg-gray-800 rounded cursor-pointer"
                  onClick={() => navigate(`/asset/${ticker.id}`)}
                  style={{
                    transition: "background 0.2s",
                    minWidth: 120,
                    height: "100%",
                  }}
                >
                  <span className="font-semibold text-white">{ticker.name}</span>
                  <span className="ml-1 text-gray-400 text-xs">{ticker.symbol}</span>
                  <span
                    className={`ml-2 font-bold transition-colors duration-700 ease-out ${colorClass}`}
                  >
                    {ticker.currentPrice.toLocaleString()}
                  </span>
                  <span
                    className={`ml-2 font-semibold text-sm ${
                      ticker.priceChange > 0
                        ? "text-green-400"
                        : ticker.priceChange < 0
                          ? "text-red-400"
                          : "text-gray-300"
                    }`}
                  >
                    {ticker.priceChange > 0 && "+"}
                    {ticker.priceChange.toFixed(2)}%
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(TickerTape);
