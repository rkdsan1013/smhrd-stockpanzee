// /frontend/src/providers/AuthProvider.tsx
import React, { createContext, useState } from "react";

interface AuthContextProps {
  token: string | null;
  setToken: (token: string | null) => void;
}

export const AuthContext = createContext<AuthContextProps>({
  token: null,
  setToken: () => {},
});

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);

  // 로그인, 로그아웃 또는 토큰 갱신 로직 등을 추가할 수 있습니다.
  return <AuthContext.Provider value={{ token, setToken }}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
