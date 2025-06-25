// /frontend/src/providers/AuthProvider.tsx
import React, { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import authService from "../services/authService";
import type { UserProfile, LoginData, RegisterData } from "../services/authService";

interface AuthContextProps {
  user: UserProfile | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextProps>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);

  // 마운트 시 프로필 로드
  useEffect(() => {
    authService
      .fetchProfile()
      .then((profile) => setUser(profile))
      .catch(() => setUser(null));
  }, []);

  const login = async (data: LoginData) => {
    await authService.loginUser(data);
    const profile = await authService.fetchProfile();
    setUser(profile);
  };

  const register = async (data: RegisterData) => {
    await authService.registerUser(data);
    const profile = await authService.fetchProfile();
    setUser(profile);
  };

  const logout = async () => {
    await authService.logoutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
