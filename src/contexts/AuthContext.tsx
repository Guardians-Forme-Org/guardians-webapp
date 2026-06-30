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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiFetch, setUnauthorizedHandler } from "@/lib/api";
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
  UserMetadata,
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
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string, accessToken?: string) => Promise<void>;
  logout: () => void;
  patchUserMetadata: (patch: Partial<UserMetadata>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchDefaultAvatar(): Promise<File> {
  const res = await fetch("/images/Guardians Logo-logo.png");
  const blob = await res.blob();
  return new File([blob], "avatar.png", { type: blob.type || "image/png" });
}

// Rebuilds loginData from the user profile endpoint — called whenever ["loginData"] is invalidated.
export async function fetchLoginData(userId: string): Promise<LoginData> {
  const profile = await api.get<LoginData>(`/users/${userId}`);
  return {
    challenges: profile.challenges ?? [],
    circles: profile.circles ?? [],
    impactRecords: profile.impactRecords ?? [],
    challengesCount: profile.challengesCount,
    circlesCount: profile.circlesCount,
    contributionMarkers: profile.contributionMarkers,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<Language | null>(null);
  const [loading, setLoading] = useState(true);

  // loginData lives in React Query — any mutation can invalidate ["loginData"] to trigger a refresh
  const { data: loginData = null } = useQuery({
    queryKey: ["loginData"],
    queryFn: () => fetchLoginData(user!.id),
    enabled: !!user?.id && !!token,
    staleTime: 2 * 60 * 1000,
  });

  // Keep localStorage in sync whenever React Query updates loginData
  useEffect(() => {
    if (loginData) saveLoginData(loginData);
  }, [loginData]);

  const logout = useCallback(() => {
    clearSession();
    queryClient.removeQueries({ queryKey: ["loginData"] });
    setToken(null);
    setUser(null);
    setPreferredLanguage(null);
    router.push("/login");
  }, [router, queryClient]);

  // Wire logout into apiFetch so a 401 after token expiry redirects to login
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Bootstrap from localStorage on mount
  useEffect(() => {
    const stored = getStoredSession();
    if (stored.token && stored.user) {
      if (stored.loginData) {
        queryClient.setQueryData(["loginData"], stored.loginData);
      }
      setToken(stored.token);
      setUser(stored.user);
      setPreferredLanguage(stored.preferredLanguage);
    }
    setLoading(false);
  }, [queryClient]);

  const login = useCallback(
    async (emailOrMobile: string, password: string) => {
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
      queryClient.setQueryData(["loginData"], data);

      setToken(metaData.access_token);
      setUser(metaData.user);
      setPreferredLanguage(lang?.id ? lang : null);
    },
    [queryClient],
  );

  const register = useCallback(async (data: RegisterRequest, avatarFile?: File) => {
    const formData = new FormData();
    formData.append("metadata", JSON.stringify(data));
    formData.append("avatarFile", avatarFile ?? await fetchDefaultAvatar());
    await apiFetch("/signup", { method: "POST", body: formData });
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await api.post("/recover", { email });
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string, accessToken?: string) => {
    await apiFetch(`/resetPassword/${token}`, {
      method: "PUT",
      body: { password: newPassword },
      ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}),
    });
  }, []);

  const patchUserMetadata = useCallback((patch: Partial<UserMetadata>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: AuthUser = {
        ...prev,
        user_metadata: { ...prev.user_metadata, ...patch },
      };
      localStorage.setItem("gotf_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, preferredLanguage, loginData, loading, login, register, forgotPassword, resetPassword, logout, patchUserMetadata }}
    >
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
