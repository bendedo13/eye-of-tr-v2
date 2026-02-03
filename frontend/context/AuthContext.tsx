"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, register as apiRegister, me } from "@/lib/api";

type User = { id: number; email: string } | null;

type AuthContextType = {
  user: User;
  token: string | null;
  loading: boolean;
  mounted: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "eye-of-tr-token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Hydration-safe initialization
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      if (token !== stored) {
        setToken(stored);
      }
      me(stored)
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        })
        .finally(() => {
          setLoading(false);
          setMounted(true);
        });
    } else {
      setLoading(false);
      setMounted(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { access_token } = await apiLogin(email, password);
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const u = await me(access_token);
    setUser(u);
  };

  const register = async (email: string, username: string, password: string, referralCode?: string) => {
    const { access_token } = await apiRegister(email, username, password, referralCode);
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const u = await me(access_token);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, mounted, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
