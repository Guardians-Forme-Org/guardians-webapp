import { getToken } from "./auth";
import { getCurrentLocale } from "./locale-store";
import type { Language } from "./types/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const API_KEY = process.env.NEXT_PUBLIC_X_API_KEY ?? "";

let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  unauthorizedHandler = fn;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Typed fetch wrapper for the Guardians API.
 * Automatically injects Authorization, X-Api-Key, and Accept-Language headers.
 * Throws an Error with the server's error message on non-2xx responses.
 */
export async function apiFetch<T>(
  path: string,
  options: {
    method?: Method;
    body?: unknown;
    headers?: Record<string, string>;
    lang?: string;
  } = {}
): Promise<T> {
  const token = getToken();

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    "Accept-Language": options.lang ?? getCurrentLocale(),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(API_KEY ? { "X-Api-Key": API_KEY } : {}),
    ...options.headers,
  };

  const method = options.method ?? "GET";
  if (isFormData) {
    const entries: Record<string, unknown> = {};
    for (const [key, val] of (options.body as FormData).entries()) {
      entries[key] = val instanceof File ? `File(${val.name}, ${val.size}b)` : val;
    }
    console.log(`[api] ${method} ${BASE_URL}${path}\n` + JSON.stringify({ headers, body: entries }, null, 2));
  } else {
    console.log(`[api] ${method} ${BASE_URL}${path}\n` + JSON.stringify({ headers, body: options.body ?? null }, null, 2));
  }

  const body = isFormData
    ? (options.body as FormData)
    : options.body !== undefined
      ? JSON.stringify(options.body)
      : undefined;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body } : {}),
  });

  const json = await response.json().catch(() => null);
  console.log(
    `[api] ${method} ${BASE_URL}${path} → ${response.status}\n` +
    JSON.stringify(json, null, 2)
  );

  if (!response.ok) {
    if (response.status === 401) {
      unauthorizedHandler?.();
    }
    const message =
      (json as { error?: string } | null)?.error ??
      `API error ${response.status}`;
    throw new Error(message);
  }

  return json as T;
}

// ── Convenience methods ───────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, lang?: string) => apiFetch<T>(path, { lang }),
  post: <T>(path: string, body: unknown, lang?: string) =>
    apiFetch<T>(path, { method: "POST", body, lang }),
  put: <T>(path: string, body: unknown, lang?: string) =>
    apiFetch<T>(path, { method: "PUT", body, lang }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};

// ── Domain helpers ────────────────────────────────────────────────────────────

export async function fetchLanguages(lang?: string): Promise<Language[]> {
  const result = await apiFetch<{ data: Language[]; success: boolean }>(
    "/languages",
    { lang }
  );
  return result.data;
}
