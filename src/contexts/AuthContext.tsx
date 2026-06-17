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
import { api, apiFetch } from "@/lib/api";
import {
  clearSession,
  getStoredSession,
  saveSession,
  saveLoginData,
  type LoginData,
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
  loginData: LoginData | null;
  loading: boolean;
  login: (emailOrMobile: string, password: string) => Promise<void>;
  register: (data: RegisterRequest, avatarFile?: File) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<Language | null>(null);
  const [loginData, setLoginData] = useState<LoginData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredSession();
    if (stored.token && stored.user) {
      setToken(stored.token);
      setUser(stored.user);
      setPreferredLanguage(stored.preferredLanguage);
      setLoginData(stored.loginData);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (emailOrMobile: string, password: string) => {
    const response = await api.post<LoginResponse>("/login", {
      username: emailOrMobile,
      password,
    });
    const { metaData } = response;
    const lang = metaData.user.user_metadata?.preferredLanguage ?? null;
    saveSession(metaData, lang ?? undefined);

    const data: LoginData = {
      challenges: response.challenges ?? [],
      circles: response.circles ?? [],
      impactRecords: response.impactRecords ?? [],
      challengesCount: response.challengesCount,
      circlesCount: response.circlesCount,
      contributionMarkers: response.contributionMarkers,
    };
    saveLoginData(data);

    setToken(metaData.access_token);
    setUser(metaData.user);
    setPreferredLanguage(lang?.id ? lang : null);
    setLoginData(data);
  }, []);

  const register = useCallback(async (data: RegisterRequest, avatarFile?: File) => {
    const formData = new FormData();
    formData.append("metadata", JSON.stringify(data));
    if (avatarFile) formData.append("avatarFile", avatarFile);
    await apiFetch("/signup", { method: "POST", body: formData });
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    setPreferredLanguage(null);
    setLoginData(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, preferredLanguage, loginData, loading, login, register, logout }}>
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
