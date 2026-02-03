"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { login as apiLogin, register as apiRegister, me, resendVerificationCode, verifyEmail } from "@/lib/api";

type User =
  | {
      id: number;
      email: string;
      username: string;
      credits: number;
      role: string;
      tier: string;
      referral_code: string;
      referral_count: number;
      is_active?: boolean;
    }
  | null;

type AuthContextType = {
  user: User;
  token: string | null;
  loading: boolean;
  mounted: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, referralCode?: string) => Promise<{ needsVerification: boolean; email: string; debugCode?: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<string | undefined>;
  refresh: () => Promise<void>;
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
    const result = await apiRegister(email, username, password, referralCode);
    if (!result.access_token) {
      return { needsVerification: true, email, debugCode: result.debug_code };
    }
    localStorage.setItem(TOKEN_KEY, result.access_token);
    setToken(result.access_token);
    const u = await me(result.access_token);
    setUser(u);
    return { needsVerification: false, email };
  };

  const completeVerification = async (email: string, code: string) => {
    const { access_token } = await verifyEmail(email, code);
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const u = await me(access_token);
    setUser(u);
  };

  const resendCode = async (email: string) => {
    const res = await resendVerificationCode(email);
    return res.debug_code;
  };

  const refresh = async () => {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) return;
    setToken(t);
    const u = await me(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, mounted, login, register, verifyEmail: completeVerification, resendCode, refresh, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
