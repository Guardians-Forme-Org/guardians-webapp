import type { AuthMetadata, AuthUser, Language, LoginResponse } from "./types/auth";

export type LoginData = Pick<LoginResponse, "challenges" | "circles" | "impactRecords" | "challengesCount" | "circlesCount" | "contributionMarkers">;

const KEYS = {
  token: "gotf_token",
  refresh: "gotf_refresh",
  expiresAt: "gotf_expires_at",
  user: "gotf_user",
  preferredLanguage: "gotf_lang",
  loginData: "gotf_login_data",
} as const;

export function saveSession(meta: AuthMetadata, lang?: Language): void {
  const expiresAt = Date.now() + meta.expires_in * 1000;
  localStorage.setItem(KEYS.token, meta.access_token);
  localStorage.setItem(KEYS.refresh, meta.refresh_token);
  localStorage.setItem(KEYS.expiresAt, String(expiresAt));
  localStorage.setItem(KEYS.user, JSON.stringify(meta.user));
  if (lang?.id) {
    localStorage.setItem(KEYS.preferredLanguage, JSON.stringify(lang));
  }
}

export function saveLoginData(data: LoginData): void {
  localStorage.setItem(KEYS.loginData, JSON.stringify(data));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.token);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.refresh);
}

export function isTokenExpired(): boolean {
  const expiresAt = Number(localStorage.getItem(KEYS.expiresAt) ?? 0);
  return expiresAt > 0 && Date.now() > expiresAt;
}

export function isTokenExpiringSoon(windowMs = 5 * 60 * 1000): boolean {
  const expiresAt = Number(localStorage.getItem(KEYS.expiresAt) ?? 0);
  return expiresAt > 0 && Date.now() > expiresAt - windowMs;
}

export async function refreshAccessToken(refreshToken: string): Promise<AuthMetadata> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const apiKey = process.env.NEXT_PUBLIC_X_API_KEY ?? "";
  const res = await fetch(`${baseUrl}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-Api-Key": apiKey } : {}),
    },
    body: JSON.stringify({ grant_type: "refresh_token", refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const json = await res.json();
  // Backend may wrap in metaData like the login response does
  return (json.metaData ?? json) as AuthMetadata;
}

export function getStoredSession(): {
  token: string | null;
  user: AuthUser | null;
  preferredLanguage: Language | null;
  loginData: LoginData | null;
} {
  if (typeof window === "undefined") {
    return { token: null, user: null, preferredLanguage: null, loginData: null };
  }
  const token = getToken();
  const user = parseJson<AuthUser>(localStorage.getItem(KEYS.user));
  const preferredLanguage = parseJson<Language>(localStorage.getItem(KEYS.preferredLanguage));
  const loginData = parseJson<LoginData>(localStorage.getItem(KEYS.loginData));
  return { token, user, preferredLanguage, loginData };
}

export function clearSession(): void {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
