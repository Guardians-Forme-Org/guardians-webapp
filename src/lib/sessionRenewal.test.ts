import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// apiFetch and the session store run in the browser: give them a window and
// localStorage, and a fake API behind fetch
const store = new Map<string, string>();
vi.stubGlobal("window", {});
vi.stubGlobal("localStorage", {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
});

const { apiFetch, setUnauthorizedHandler } = await import("./api");

type Call = { path: string; auth?: string; body?: string };
let calls: Call[] = [];

function api(handler: (path: string, auth?: string) => { status: number; json: unknown }) {
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit) => {
    const path = url.replace(/^.*?(\/[a-zA-Z]+.*)$/, "$1");
    const auth = (init.headers as Record<string, string>).Authorization;
    calls.push({ path, auth, body: init.body as string | undefined });
    const { status, json } = handler(path, auth);
    return { ok: status < 400, status, json: async () => json } as Response;
  }));
}

const renewed = { metaData: { access_token: "new-token", refresh_token: "new-refresh", expires_in: 3600 } };

beforeEach(() => {
  store.clear();
  calls = [];
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "groupCollapsed").mockImplementation(() => {});
  vi.spyOn(console, "groupEnd").mockImplementation(() => {});
});
afterEach(() => setUnauthorizedHandler(null));

describe("session renewal", () => {
  it("renews before a request when the token is about to expire", async () => {
    store.set("gotf_token", "old-token");
    store.set("gotf_refresh_token", "refresh-1");
    store.set("gotf_token_expires_at", String(Date.now() + 10_000));
    api((path) => (path === "/refresh" ? { status: 200, json: renewed } : { status: 200, json: { ok: true } }));

    await apiFetch("/circles");

    expect(calls.map((c) => c.path)).toEqual(["/refresh", "/circles"]);
    expect(JSON.parse(calls[0].body!)).toEqual({ refresh_token: "refresh-1" });
    expect(calls[1].auth).toBe("Bearer new-token");
    expect(store.get("gotf_refresh_token")).toBe("new-refresh");
    expect(Number(store.get("gotf_token_expires_at"))).toBeGreaterThan(Date.now() + 3_500_000);
  });

  it("leaves a fresh token alone", async () => {
    store.set("gotf_token", "token");
    store.set("gotf_refresh_token", "refresh-1");
    store.set("gotf_token_expires_at", String(Date.now() + 30 * 60_000));
    api(() => ({ status: 200, json: {} }));

    await apiFetch("/circles");

    expect(calls.map((c) => c.path)).toEqual(["/circles"]);
  });

  it("renews once on a 401 and retries the request", async () => {
    store.set("gotf_token", "old-token");
    store.set("gotf_refresh_token", "refresh-1");
    const signOut = vi.fn();
    setUnauthorizedHandler(signOut);
    api((path, auth) => {
      if (path === "/refresh") return { status: 200, json: renewed };
      return auth === "Bearer new-token" ? { status: 200, json: { ok: true } } : { status: 401, json: { error: "expired" } };
    });

    await expect(apiFetch("/circles/X/leads", { method: "PUT" })).resolves.toEqual({ ok: true });
    expect(calls.map((c) => c.path)).toEqual(["/circles/X/leads", "/refresh", "/circles/X/leads"]);
    expect(signOut).not.toHaveBeenCalled();
  });

  it("signs out when the session can't be renewed", async () => {
    store.set("gotf_token", "old-token");
    store.set("gotf_refresh_token", "refresh-1");
    const signOut = vi.fn();
    setUnauthorizedHandler(signOut);
    api(() => ({ status: 401, json: { error: "expired" } }));

    await expect(apiFetch("/circles/X/leads", { method: "PUT" })).rejects.toThrow("expired");
    expect(calls.map((c) => c.path)).toEqual(["/circles/X/leads", "/refresh"]);
    expect(signOut).toHaveBeenCalledOnce();
  });

  it("shares one renewal between requests made at the same time", async () => {
    store.set("gotf_token", "old-token");
    store.set("gotf_refresh_token", "refresh-1");
    store.set("gotf_token_expires_at", String(Date.now() - 1));
    api((path) => (path === "/refresh" ? { status: 200, json: renewed } : { status: 200, json: {} }));

    await Promise.all([apiFetch("/a"), apiFetch("/b"), apiFetch("/c")]);

    expect(calls.filter((c) => c.path === "/refresh")).toHaveLength(1);
    expect(calls.filter((c) => c.path !== "/refresh").every((c) => c.auth === "Bearer new-token")).toBe(true);
  });

  it("doesn't try to renew a wrong password", async () => {
    const signOut = vi.fn();
    setUnauthorizedHandler(signOut);
    api(() => ({ status: 401, json: { error: "Invalid login credentials" } }));

    await expect(apiFetch("/login", { method: "POST", body: {} })).rejects.toThrow("Invalid login credentials");
    expect(calls.map((c) => c.path)).toEqual(["/login"]);
  });
});
