// /frontend/src/providers/AppProvider.tsx
import React from "react";
import type { ReactNode } from "react";
import AuthProvider from "./AuthProvider";
import { AssetProvider } from "./AssetProvider";

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <AssetProvider>
        {/* 다른 Provider 예: <ThemeProvider>{children}</ThemeProvider> */}
        {children}
      </AssetProvider>
    </AuthProvider>
  );
};

export default AppProviders;
