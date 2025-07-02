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
  const [showFav, setShowFav] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const tapeInnerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const lastTimeRef = useRef<number | null>(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // fetch ticker (5초마다)
  useEffect(() => {
    let running = true;
    const load = async () => {
      try {
        const data = await fetchTickers();
        setTickers(Array.isArray(data) ? data : []);
      } catch (e) {
        setTickers([]);
      }
      if (running) setTimeout(load, 5000);
    };
    load();
    return () => {
      running = false;
    };
  }, []);

  // fetch favorites
  useEffect(() => {
    if (user) {
      fetchFavorites()
        .then(setFavorites)
        .catch(() => setFavorites([]));
    } else {
      setFavorites([]);
    }
  }, [user]);

  // 전체 10개씩 추출
  const koreaTop10 = tickers
    .filter((t) => getCategory(t.market) === "한국")
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 5);
  const globalTop10 = tickers
    .filter((t) => getCategory(t.market) === "해외")
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 5);
  const cryptoTop10 = tickers
    .filter((t) => getCategory(t.market) === "암호화폐")
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, 5);

  let displayTickers: Ticker[] = [];
  if (showFav && user && favorites.length > 0) {
    displayTickers = tickers.filter((t) => favorites.includes(t.id));
    displayTickers = [...displayTickers, ...displayTickers];
  } else {
    displayTickers = [
      ...koreaTop10,
      ...globalTop10,
      ...cryptoTop10,
      ...koreaTop10,
      ...globalTop10,
      ...cryptoTop10,
    ];
  }

  // 실제 ticker 길이
  const [tapeWidth, setTapeWidth] = useState(0);
  useEffect(() => {
    if (tapeInnerRef.current) {
      setTapeWidth(tapeInnerRef.current.scrollWidth / 2);
    }
  }, [tickers, favorites, showFav]);

  // ticker 애니메이션
  const speed = 30;
  useEffect(() => {
    let running = true;
    function step(ts: number) {
      if (!running) return;
      if (lastTimeRef.current === null) lastTimeRef.current = ts;
      if (!isPaused && tapeWidth > 0) {
        const dt = ts - (lastTimeRef.current ?? ts);
        setOffset((prev) => {
          let next = prev - (dt * speed) / 1000;
          if (-next >= tapeWidth) next = 0;
          return next;
        });
      }
      lastTimeRef.current = ts;
      requestAnimationFrame(step);
    }
    const raf = requestAnimationFrame(step);
    return () => {
      running = false;
      lastTimeRef.current = null;
      cancelAnimationFrame(raf);
    };
  }, [isPaused, tapeWidth, speed]);

  return (
    <div
      className="fixed left-0 right-0 bottom-0 w-screen z-[99] bg-[#161b22] border-t border-gray-800 overflow-hidden flex items-center"
      style={{
        height: 48,
        minHeight: 40,
        boxShadow: "0 -2px 6px rgba(0,0,0,0.15)",
        pointerEvents: "auto",
        fontFamily: "system-ui,sans-serif",
      }}
    >
      {/* 바나나 버튼 (항상 z-50, pointer-events-auto) */}
      <div
        className="flex items-center justify-center h-full relative"
        style={{
          width: 48,
          minWidth: 48,
          background: "rgba(22,27,34,0.95)",
          borderRight: "1.5px solid #222",
          zIndex: 50,
          pointerEvents: "auto", // 이거 중요!
        }}
      >
        <button
          onClick={() => setShowFav((v) => !v)}
          className="w-full h-full flex items-center justify-center focus:outline-none"
          style={{
            background: "none",
            border: "none",
            pointerEvents: "auto",
            cursor: "pointer",
            fontSize: "2rem",
            color: showFav ? "#FFD600" : "#bbb",
            transition: "color 0.2s",
            borderRadius: "0",
            userSelect: "none",
            zIndex: 51,
          }}
          tabIndex={0}
          aria-label="즐겨찾기 모드"
        >
          <Icons
            name="banana"
            className={`w-7 h-7 ${showFav ? "text-yellow-400" : "text-gray-400"}`}
          />
        </button>
      </div>

      {/* 테이프 */}
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
            displayTickers.map((ticker, i) => (
              <div
                key={ticker.id + "-" + i}
                className="flex items-center gap-1 px-5 hover:bg-gray-800 rounded cursor-pointer"
                onClick={() => navigate(`/asset/${ticker.id}`)}
                style={{
                  transition: "background 0.2s",
                  minWidth: 120,
                  height: "100%",
                  alignItems: "center",
                }}
              >
                <span className="font-semibold text-white">{ticker.name}</span>
                <span className="ml-1 text-gray-400 text-xs">{ticker.symbol}</span>
                <span className="ml-2 font-bold text-white">
                  {(ticker.currentPrice ?? 0).toLocaleString()}
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
                  {(ticker.priceChange ?? 0).toFixed(2)}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default React.memo(TickerTape);
