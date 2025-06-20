// /frontend/src/providers/AppProvider.tsx
import React from "react";
import type { ReactNode } from "react";
import AuthProvider from "./AuthProvider";
// 추가 Provider가 있다면 여기서 함께 import 후 중첩할 수 있습니다.

interface AppProvidersProps {
  children: ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      {/* 다른 Provider 예: <ThemeProvider>{children}</ThemeProvider> */}
      {children}
    </AuthProvider>
  );
};

export default AppProviders;
