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
import { api, apiFetch } from "@/lib/api";
import {
  clearSession,
  getStoredSession,
  saveSession,
  saveLoginData,
  getRefreshToken,
  isTokenExpired,
  refreshAccessToken,
  type LoginData,
} from "@/lib/auth";
import type {
  AuthUser,
  Language,
  LoginResponse,
  RegisterRequest,
} from "@/lib/types/auth";
import type { ApiCircle, ApiCircleChallenge } from "@/lib/types/circles";

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

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchDefaultAvatar(): Promise<File> {
  const res = await fetch("/images/Guardians Logo-logo.png");
  const blob = await res.blob();
  return new File([blob], "avatar.png", { type: blob.type || "image/png" });
}

// Rebuilds loginData from live endpoints — called whenever ["loginData"] is invalidated.
// impactRecords are aggregated from the user's circles (no dedicated endpoint yet).
export async function fetchLoginData(userId: string): Promise<LoginData> {
  const [challenges, circles] = await Promise.all([
    api.get<ApiCircleChallenge[]>("/challenges"),
    api.get<ApiCircle[]>("/circles"),
  ]);
  const userChallenges = challenges.filter((c) =>
    (c.members ?? []).some((m) => m.userId === userId),
  );
  const userCircles = circles.filter((c) =>
    c.members.some((m) => m.userId === userId),
  );
  return {
    challenges: userChallenges,
    circles: userCircles,
    impactRecords: userCircles.flatMap((c) => c.impactRecords ?? []),
    challengesCount: {
      total: userChallenges.length,
      label: "Challenges",
      displayValue: String(userChallenges.length).padStart(2, "0"),
    },
    circlesCount: {
      total: userCircles.length,
      label: "Circles",
      displayValue: String(userCircles.length).padStart(2, "0"),
    },
    contributionMarkers: null,
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
    queryKey: ["loginData", user?.id],
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

  const refresh = useCallback(async () => {
    const rt = getRefreshToken();
    if (!rt) { logout(); return; }
    try {
      const meta = await refreshAccessToken(rt);
      saveSession(meta);
      setToken(meta.access_token);
      setUser(meta.user);
    } catch {
      logout();
    }
  }, [logout]);

  // Bootstrap from localStorage on mount
  useEffect(() => {
    const stored = getStoredSession();
    if (stored.token && stored.user) {
      if (stored.loginData) {
        queryClient.setQueryData(["loginData", stored.user.id], stored.loginData);
      }
      if (isTokenExpired()) {
        const rt = getRefreshToken();
        if (rt) {
          refreshAccessToken(rt)
            .then((meta) => {
              saveSession(meta);
              setToken(meta.access_token);
              setUser(meta.user);
              setPreferredLanguage(stored.preferredLanguage);
            })
            .catch(() => clearSession())
            .finally(() => setLoading(false));
          return;
        }
        clearSession();
      } else {
        setToken(stored.token);
        setUser(stored.user);
        setPreferredLanguage(stored.preferredLanguage);
      }
    }
    setLoading(false);
  }, [queryClient]);

  // Proactive refresh every 15 min — keeps sessions alive without user interaction
  useEffect(() => {
    if (!user) return;
    const id = setInterval(refresh, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [user, refresh]);

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
      queryClient.setQueryData(["loginData", metaData.user.id], data);

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

  return (
    <AuthContext.Provider
      value={{ user, token, preferredLanguage, loginData, loading, login, register, logout }}
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
