"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  clearSession,
  getStoredSession,
  saveSession,
} from "@/lib/auth";
import type {
  AuthUser,
  Language,
  LoginResponse,
  RegisterRequest,
} from "@/lib/types/auth";

// ── Context shape ─────────────────────────────────────────────────────────────

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  preferredLanguage: Language | null;
  loading: boolean;
  login: (emailOrMobile: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<Language | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredSession();
    if (stored.token && stored.user) {
      setToken(stored.token);
      setUser(stored.user);
      setPreferredLanguage(stored.preferredLanguage);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (emailOrMobile: string, password: string) => {
    const response = await api.post<LoginResponse>("/login", {
      username: emailOrMobile,
      password,
    });
    const { metaData, preferredLanguage: lang } = response.data;
    saveSession(metaData, lang);
    setToken(metaData.access_token);
    setUser(metaData.user);
    setPreferredLanguage(lang?.id ? lang : null);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await api.post("/register", data);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    setPreferredLanguage(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, preferredLanguage, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
