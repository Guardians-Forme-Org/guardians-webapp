"use client";

import { api, apiFetch, setUnauthorizedHandler } from "@/lib/api";
import {
  clearSession,
  getStoredSession,
  saveLoginData,
  saveSession,
  type LoginData,
} from "@/lib/auth";
import type {
  AuthUser,
  Language,
  LoginResponse,
  RegisterRequest,
  UserMetadata,
} from "@/lib/types/auth";
import { useUserMetadata } from "@/lib/hooks/users";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

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
  resetPassword: (
    token: string,
    newPassword: string,
    accessToken?: string,
  ) => Promise<void>;
  logout: () => void;
  patchUserMetadata: (patch: Partial<UserMetadata>) => void;
  refreshProfile: () => void;
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
  const [preferredLanguage, setPreferredLanguage] = useState<Language | null>(
    null,
  );
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

  // The stored user is a snapshot taken at /login — without this it never
  // changes, so an edited name/avatar/location only appeared after a re-login
  const { data: freshMetadata } = useUserMetadata(user?.id, !!user?.id && !!token);

  useEffect(() => {
    if (!freshMetadata) return;
    setUser((prev) => {
      if (!prev) return prev;
      // Empty/missing remote values mean "not set", not "cleared" — keep what
      // we have (e.g. an avatar recovered from member data below)
      const keep = <T,>(next: T | undefined, current: T): T =>
        next === undefined || next === "" ? current : next;
      const merged: UserMetadata = {
        ...prev.user_metadata,
        firstName: keep(freshMetadata.firstName, prev.user_metadata.firstName),
        lastName: keep(freshMetadata.lastName, prev.user_metadata.lastName),
        mobile: keep(freshMetadata.mobile, prev.user_metadata.mobile),
        avatarUrl: keep(freshMetadata.avatarUrl, prev.user_metadata.avatarUrl),
        location: keep(freshMetadata.location, prev.user_metadata.location),
      };
      if (JSON.stringify(merged) === JSON.stringify(prev.user_metadata)) return prev;
      const updated = { ...prev, user_metadata: merged };
      localStorage.setItem("gotf_user", JSON.stringify(updated));
      return updated;
    });
  }, [freshMetadata]);

  // Recover an avatar from member data when the profile itself carries none,
  // so it survives page refresh. Member avatars are join-time snapshots, so
  // this only ever fills a gap — it must not overwrite the metadata above.
  useEffect(() => {
    if (!loginData || !user?.id || user.user_metadata.avatarUrl) return;
    const memberAvatar =
      loginData.circles
        .flatMap((c) => c.members)
        .find((m) => m.userId === user.id)?.avatarUrl ||
      loginData.challenges
        .flatMap((c) => c.members ?? [])
        .find((m) => m.userId === user.id)?.avatarUrl;
    if (memberAvatar) {
      setUser((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          user_metadata: { ...prev.user_metadata, avatarUrl: memberAvatar },
        };
        localStorage.setItem("gotf_user", JSON.stringify(updated));
        return updated;
      });
    }
  }, [loginData, user?.id, user?.user_metadata.avatarUrl]);

  // The loginData observer lives here, in a provider that never unmounts, so
  // navigating to a screen can't refetch it on its own — impact, counts and
  // markers would keep showing whatever was fetched on the last cold start.
  // Screens that display those stats call this when they open.
  const refreshProfile = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["loginData"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
    queryClient.invalidateQueries({ queryKey: ["thingImpactRecords"] });
  }, [queryClient]);

  const logout = useCallback(() => {
    clearSession();
    queryClient.removeQueries({ queryKey: ["loginData"] });
    queryClient.removeQueries({ queryKey: ["users"] });
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
        // updatedAt: 0 marks this seeded snapshot as already stale, so the
        // loginData query below refetches immediately instead of trusting a
        // possibly-old localStorage copy for the next 2 minutes (staleTime) —
        // still paints instantly from cache, just doesn't block the refresh
        queryClient.setQueryData(["loginData"], stored.loginData, { updatedAt: 0 });
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
      // Drop any user list cached before this login — /login just returned the
      // freshest metadata, so a pre-login copy must not be merged over it
      queryClient.removeQueries({ queryKey: ["users"] });

      setToken(metaData.access_token);
      setUser(metaData.user);
      setPreferredLanguage(lang?.id ? lang : null);
    },
    [queryClient],
  );

  const register = useCallback(
    async (data: RegisterRequest, avatarFile?: File) => {
      const formData = new FormData();
      formData.append("metadata", JSON.stringify(data));
      formData.append("avatarFile", avatarFile ?? (await fetchDefaultAvatar()));
      await apiFetch("/signup", { method: "POST", body: formData });
    },
    [],
  );

  const forgotPassword = useCallback(async (email: string) => {
    await api.post("/recover", { email });
  }, []);

  const resetPassword = useCallback(
    async (token: string, newPassword: string, accessToken?: string) => {
      await apiFetch(`/resetPassword/${token}`, {
        method: "PUT",
        body: { password: newPassword },
        ...(accessToken
          ? { headers: { Authorization: `Bearer ${accessToken}` } }
          : {}),
      });
    },
    [],
  );

  const patchUserMetadata = useCallback((patch: Partial<UserMetadata>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: AuthUser = {
        ...prev,
        user_metadata: { ...prev.user_metadata, ...patch },
      };
      // Blob URLs die on page unload — persist the old avatarUrl instead
      const toStore = patch.avatarUrl?.startsWith("blob:")
        ? {
            ...updated,
            user_metadata: {
              ...updated.user_metadata,
              avatarUrl: prev.user_metadata.avatarUrl,
            },
          }
        : updated;
      localStorage.setItem("gotf_user", JSON.stringify(toStore));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        preferredLanguage,
        loginData,
        loading,
        login,
        register,
        forgotPassword,
        resetPassword,
        logout,
        patchUserMetadata,
        refreshProfile,
      }}
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
