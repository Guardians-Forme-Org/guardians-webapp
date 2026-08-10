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

// ── Console copy helper ───────────────────────────────────────────────────────
// Every request body is kept (last 50); `copyApi()` in the devtools console
// copies the most recent one as pretty-printed JSON — `copyApi(12)` copies the
// index shown in that request's log line.

type ApiLogEntry = { method: Method; path: string; body: unknown };

// Keyed by a stable per-session sequence number so the index printed in a
// log line stays valid even after older entries are pruned
const apiLog = new Map<number, ApiLogEntry>();
let apiLogSeq = 0;
const API_LOG_MAX = 50;

function copyApi(index: number = apiLogSeq - 1): string | undefined {
  const entry = apiLog.get(index);
  if (!entry) {
    console.warn(`[api] no logged request at index ${index}`);
    return undefined;
  }
  const text = JSON.stringify(entry.body, null, 2);
  const done = () =>
    console.log(`[api] copied ${entry.method} ${entry.path} payload to clipboard`);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(done, () => {
      console.warn("[api] clipboard blocked — payload returned instead");
    });
  } else {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    done();
  }
  return text;
}

declare global {
  interface Window {
    copyApi: typeof copyApi;
    apiLog: Map<number, ApiLogEntry>;
  }
}
if (typeof window !== "undefined") {
  window.copyApi = copyApi;
  window.apiLog = apiLog;
}

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
  } = {},
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
  let loggableBody: unknown = options.body ?? null;
  if (isFormData) {
    const entries: Record<string, unknown> = {};
    for (const [key, val] of (options.body as FormData).entries()) {
      if (val instanceof File) {
        entries[key] = `File(${val.name}, ${val.size}b)`;
      } else if (key === "metadata") {
        // Parse the metadata part so it expands as an object in devtools
        try {
          entries[key] = JSON.parse(val as string);
        } catch {
          entries[key] = val;
        }
      } else {
        entries[key] = val;
      }
    }
    loggableBody = entries;
  }
  const logId = apiLogSeq++;
  apiLog.set(logId, { method, path, body: loggableBody });
  if (apiLog.size > API_LOG_MAX) {
    apiLog.delete(apiLog.keys().next().value!);
  }

  console.groupCollapsed(`[api] ${method} ${path}`);
  console.log("url", `${BASE_URL}${path}`);
  console.log("headers", headers);
  console.log("body", loggableBody);
  console.log(`copy payload as JSON → copyApi(${logId})`);
  console.groupEnd();

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
  console.groupCollapsed(`[api] ${method} ${path} → ${response.status}`);
  console.log(json);
  console.groupEnd();

  if (!response.ok) {
    if (response.status === 401) {
      unauthorizedHandler?.();
    }
    const message =
      (json as { error?: string; message?: string } | null)?.error ??
      (json as { error?: string; message?: string } | null)?.message ??
      `API error ${response.status}`;
    throw new Error(message);
  }

  return json as T;
}

// True when a thrown request error's message is our own `API error {status}`
// placeholder (set above when the BE's response body had no error/message
// field) rather than something the BE actually wrote for a human to read —
// screens should swap this for a translated generic message instead of
// showing the raw status code to the user.
export function isGenericApiError(message: string): boolean {
  return /^API error \d+$/.test(message);
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
    { lang },
  );
  return result.data;
}
