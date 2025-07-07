// /frontend/src/providers/AssetProvider.tsx
import React, { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { fetchAssets, getAssetDictSync, type Asset } from "../services/assetService";

interface AssetContextValue {
  dict: Record<string, Asset[]>;
  ready: boolean;
}

export const AssetContext = createContext<AssetContextValue>({
  dict: {},
  ready: false,
});

interface AssetProviderProps {
  children: ReactNode;
}

export const AssetProvider: React.FC<AssetProviderProps> = ({ children }) => {
  // 1) 초기 동기 캐시: symbol → [Asset]
  const initial = getAssetDictSync();
  const [dict, setDict] = useState<Record<string, Asset[]>>(
    Object.entries(initial).reduce(
      (acc, [sym, a]) => {
        acc[sym] = [a];
        return acc;
      },
      {} as Record<string, Asset[]>,
    ),
  );
  const [ready, setReady] = useState(false);

  // 2) 실제 fetch 후 전체 리스트로 재구성
  useEffect(() => {
    fetchAssets()
      .then((list) => {
        const map: Record<string, Asset[]> = {};
        list.forEach((a) => {
          const sym = a.symbol.toUpperCase();
          if (!map[sym]) map[sym] = [];
          map[sym].push(a);
        });
        setDict(map);
      })
      .catch(() => {
        // ignore
      })
      .finally(() => {
        setReady(true);
      });
  }, []);

  return <AssetContext.Provider value={{ dict, ready }}>{children}</AssetContext.Provider>;
};
