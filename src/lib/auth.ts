import type { AuthMetadata, AuthUser, Language, LoginResponse } from "./types/auth";

export type LoginData = Pick<LoginResponse, "challenges" | "circles" | "impactRecords" | "challengesCount" | "circlesCount" | "contributionMarkers" | "isAdmin">;

const KEYS = {
  token: "gotf_token",
  refreshToken: "gotf_refresh_token",
  expiresAt: "gotf_token_expires_at",
  user: "gotf_user",
  preferredLanguage: "gotf_lang",
  loginData: "gotf_login_data",
} as const;

export function saveSession(meta: AuthMetadata, lang?: Language): void {
  saveTokens(meta);
  localStorage.setItem(KEYS.user, JSON.stringify(meta.user));
  if (lang?.id) {
    localStorage.setItem(KEYS.preferredLanguage, JSON.stringify(lang));
  }
}

export function saveLoginData(data: LoginData): void {
  localStorage.setItem(KEYS.loginData, JSON.stringify(data));
}

// The access token lasts about an hour; the refresh token renews it
// (POST /refresh) so people stay signed in. Older sessions saved before
// renewal existed have no refresh token and sign in again when they expire.
export function saveTokens(meta: Pick<AuthMetadata, "access_token" | "refresh_token" | "expires_in">): void {
  localStorage.setItem(KEYS.token, meta.access_token);
  if (meta.refresh_token) localStorage.setItem(KEYS.refreshToken, meta.refresh_token);
  if (meta.expires_in) {
    localStorage.setItem(KEYS.expiresAt, String(Date.now() + meta.expires_in * 1000));
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.refreshToken);
}

// When the access token expires, in ms since the epoch; null if unknown
export function getTokenExpiresAt(): number | null {
  if (typeof window === "undefined") return null;
  const raw = Number(localStorage.getItem(KEYS.expiresAt));
  return raw > 0 ? raw : null;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.token);
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
