import React, { useEffect, useState, useRef, useCallback } from "react";
import { fetchAssets } from "../services/assetService";
import type { Asset } from "../services/assetService";
import { fetchFavorites } from "../services/favoriteService";
import Icons from "./Icons";

interface NotifiedAsset extends Asset {
  thresholdCrossed: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

const Notification: React.FC<Props> = ({ isOpen, onClose, anchorRef }) => {
  const [notifiedAssets, setNotifiedAssets] = useState<NotifiedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // 위치 계산 함수
  const updatePosition = useCallback(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8 + window.scrollY,
        left: rect.left - 160 + rect.width / 2 + window.scrollX,
      });
    }
  }, [anchorRef]);

  // 클릭 외 영역 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // 초기 위치
      updatePosition();
      // 리사이즈 시 위치 업데이트
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, onClose, anchorRef, updatePosition]);

  // 알림 리스트 fetch
  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchFavorites()
      .then((favIds) => {
        const favSet = new Set(favIds);
        return fetchAssets().then((assets) => assets.filter((a) => favSet.has(a.id)));
      })
      .then((favAssets) => {
        const results = favAssets
          .map((asset) => ({
            ...asset,
            thresholdCrossed: Math.floor(Math.abs(asset.priceChange) / 5) * 5,
          }))
          .filter((a) => a.thresholdCrossed > 0);
        setNotifiedAssets(results);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen || !anchorRef.current) return null;

  // 개별 알림 닫기
  const dismiss = (id: number) => {
    setNotifiedAssets((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div
      ref={panelRef}
      className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg w-80 max-h-96 overflow-y-auto z-50"
      style={{ top: position.top, left: position.left }}
    >
      <div className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <span className="font-semibold text-gray-900 dark:text-white">알림</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <Icons name="close" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>
      {loading ? (
        <div className="text-center py-4 text-gray-600 dark:text-gray-400">로딩 중...</div>
      ) : notifiedAssets.length ? (
        <ul className="py-2">
          {notifiedAssets.map((asset) => (
            <li
              key={asset.id}
              className="px-4 py-2 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {asset.name} ({asset.symbol})
                </p>
                <p className="text-xs">
                  <span
                    className={
                      asset.priceChange >= 0
                        ? "text-green-500 dark:text-green-400"
                        : "text-red-500 dark:text-red-400"
                    }
                  >
                    {(asset.priceChange >= 0 ? "+" : "") + asset.priceChange.toFixed(2)}%
                  </span>
                </p>
              </div>
              <button
                onClick={() => dismiss(asset.id)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <Icons name="close" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-4 text-gray-600 dark:text-gray-400">
          알림 받을 변동이 없습니다.
        </div>
      )}
    </div>
  );
};

export default Notification;
