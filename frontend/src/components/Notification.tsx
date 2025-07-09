// /frontend/src/components/Notification.tsx
import React, { useEffect, useState, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { AssetContext } from "../providers/AssetProvider";
import type { Asset } from "../services/assetService";
import { fetchAssetPrices, type AssetPrice } from "../services/assetService";
import { fetchFavorites } from "../services/favoriteService";
import { fetchDismissedNotifications, dismissNotification } from "../services/notificationService";
import Icons from "./Icons";

interface NotifiedAsset extends Asset {
  priceChange: number;
  thresholdCrossed: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

const Notification: React.FC<Props> = ({ isOpen, onClose, anchorRef }) => {
  const { staticAssets, ready: assetsReady } = useContext(AssetContext);
  const [notifiedAssets, setNotifiedAssets] = useState<NotifiedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // load data when opened
  useEffect(() => {
    if (!isOpen || !assetsReady) return;
    setLoading(true);

    Promise.all([fetchFavorites(), fetchDismissedNotifications()])
      .then(([favIds, dismissedList]) => {
        const favSet = new Set<number>(favIds);
        const dismissedSet = new Set<string>(
          dismissedList.map((d) => `${d.assetId}_${d.threshold}`),
        );

        // pull only the favorites' metadata
        const favAssets = staticAssets.filter((a) => favSet.has(a.id));

        return fetchAssetPrices().then((prices) => {
          const priceMap = prices.reduce<Record<number, AssetPrice>>((acc, p) => {
            acc[p.id] = p;
            return acc;
          }, {});

          return favAssets
            .map((a) => {
              const priceInfo = priceMap[a.id];
              const change = priceInfo?.priceChange ?? 0;
              const threshold = Math.floor(Math.abs(change) / 5) * 5;
              return {
                ...a,
                priceChange: change,
                thresholdCrossed: threshold,
              };
            })
            .filter(
              (a) => a.thresholdCrossed > 0 && !dismissedSet.has(`${a.id}_${a.thresholdCrossed}`),
            );
        });
      })
      .then(setNotifiedAssets)
      .finally(() => setLoading(false));
  }, [isOpen, assetsReady, staticAssets]);

  // close when clicking outside panel or anchor
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current &&
        anchorRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50"
    >
      {/* header */}
      <div className="px-4 py-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <span className="font-semibold text-gray-900 dark:text-white">알림</span>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
        >
          <Icons name="close" className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* body */}
      {loading ? (
        <div className="py-4 text-center text-gray-600 dark:text-gray-400">로딩 중...</div>
      ) : notifiedAssets.length ? (
        <ul className="py-2">
          {notifiedAssets.map((asset) => (
            <li
              key={`${asset.id}-${asset.thresholdCrossed}`}
              className="px-4 py-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <Link to={`/asset/${asset.id}`} className="flex-1 flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {asset.name} ({asset.symbol})
                </p>
                <span
                  className={`text-xs ${
                    asset.priceChange >= 0
                      ? "text-green-500 dark:text-green-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {(asset.priceChange >= 0 ? "+" : "") + asset.priceChange.toFixed(2)}%
                </span>
              </Link>
              <button
                onClick={() =>
                  dismissNotification(asset.id, asset.thresholdCrossed).then(() =>
                    setNotifiedAssets((prev) =>
                      prev.filter(
                        (a) => a.id !== asset.id || a.thresholdCrossed !== asset.thresholdCrossed,
                      ),
                    ),
                  )
                }
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <Icons name="close" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="py-4 text-center text-gray-600 dark:text-gray-400">
          알림 받을 변동이 없습니다.
        </div>
      )}
    </div>
  );
};

export default Notification;
