// frontend/src/components/Alert.tsx
import React, { useEffect, useState } from "react";
import socket from "../socket";
import { fetchFavorites } from "../services/favoriteService";
import Icons from "./Icons";

// 토스트 메시지 타입 정의
interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

const Alert: React.FC = () => {
  const [favorites, setFavorites] = useState<number[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // 1) 즐겨찾기 목록 가져오기 + 구독 요청
  useEffect(() => {
    fetchFavorites()
      .then((ids) => {
        setFavorites(ids);
        socket.emit("subscribeFavorites", ids); // ← 즐겨찾기 assetId 룸 구독
      })
      .catch(console.error);
  }, []);

  // 2) 서버에서 stockPrice 이벤트 수신
  useEffect(() => {
    const handleStockPrice = (data: { assetId: number; symbol: string; priceChange: number }) => {
      const { assetId, symbol, priceChange } = data;
      // ±5% 이상 변동한 즐겨찾기 자산인지 확인
      if (favorites.includes(assetId) && Math.abs(priceChange) >= 5) {
        const id = `${assetId}-${Date.now()}`;
        const sign = priceChange > 0 ? "+" : "";
        const message = `${symbol} ${sign}${priceChange.toFixed(2)}%를 기록했습니다.`;
        setToasts((prev) => [
          ...prev,
          { id, message, type: priceChange >= 0 ? "success" : "error" },
        ]);
        // 5초 후 토스트 제거
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
      }
    };

    socket.on("stockPrice", handleStockPrice);
    return () => {
      socket.off("stockPrice", handleStockPrice);
    };
  }, [favorites]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 space-y-2 z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center p-3 rounded-lg shadow-lg max-w-sm w-full border-l-4 ${
            toast.type === "success"
              ? "border-green-500 bg-white dark:bg-gray-800"
              : "border-red-500 bg-white dark:bg-gray-800"
          }`}
        >
          <Icons
            name="volatility"
            className={`w-6 h-6 ${toast.type === "success" ? "text-green-500" : "text-red-500"}`}
          />
          <span className="ml-3 text-sm text-gray-900 dark:text-gray-100">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export default Alert;
