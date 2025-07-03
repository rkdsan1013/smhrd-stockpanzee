import React, { useEffect, useState, useRef } from "react";
import { fetchAssets } from "../services/assetService";
import type { Asset } from "../services/assetService";
import { fetchFavorites } from "../services/favoriteService";

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
  const panelRef = useRef<HTMLDivElement>(null);

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
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

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
          .map((asset) => {
            const pct = asset.priceChange;
            const threshold = Math.floor(Math.abs(pct) / 5) * 5;
            return { ...asset, thresholdCrossed: threshold };
          })
          .filter((a) => a.thresholdCrossed > 0);
        setNotifiedAssets(results);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen || !anchorRef.current) return null;

  // 위치 계산
  const rect = anchorRef.current.getBoundingClientRect();

  return (
    <div
      ref={panelRef}
      className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg w-80 max-h-96 overflow-y-auto z-50"
      style={{ top: rect.bottom + 8, left: rect.left - 160 + rect.width / 2 }}
    >
      <div className="py-2 px-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <span className="font-semibold text-gray-900 dark:text-white">알림</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          ✕
        </button>
      </div>
      {loading ? (
        <div className="text-center py-4 text-gray-600 dark:text-gray-400">로딩 중...</div>
      ) : notifiedAssets.length ? (
        <ul className="py-2">
          {notifiedAssets.map((asset) => (
            <li
              key={asset.id}
              className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {asset.name} ({asset.symbol})
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {asset.priceChange.toFixed(2)}% ±{asset.thresholdCrossed}%
                  </p>
                </div>
              </div>
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
