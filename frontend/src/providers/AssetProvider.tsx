import React, { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { fetchAssets, getAssetDictSync, type Asset } from "../services/assetService";

interface AssetContextValue {
  staticAssets: Asset[];
  ready: boolean;
}

export const AssetContext = createContext<AssetContextValue>({
  staticAssets: [],
  ready: false,
});

interface AssetProviderProps {
  children: ReactNode;
}

export const AssetProvider: React.FC<AssetProviderProps> = ({ children }) => {
  // 1) localStorage → 메모리 캐시
  const initial = getAssetDictSync();
  const [staticAssets, setStaticAssets] = useState<Asset[]>(Object.values(initial));
  const [ready, setReady] = useState(false);

  // 2) 페이지 로드 후 네트워크에서 최신 메타데이터 fetch
  useEffect(() => {
    fetchAssets()
      .then((list) => setStaticAssets(list))
      .catch(() => {
        // 실패해도 initial 유지
      })
      .finally(() => setReady(true));
  }, []);

  return <AssetContext.Provider value={{ staticAssets, ready }}>{children}</AssetContext.Provider>;
};
