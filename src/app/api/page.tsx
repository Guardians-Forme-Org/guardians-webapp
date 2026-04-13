import { RainbowJSON } from "../RainbowJSON";

const API_BASE = process.env.NEXT_PUBLIC_API_URL as string;

const ENDPOINTS = [
  "health",
  "circles",
  "challenges",
  "ValidationTiers",
  "circlesMembers", //
  "challengesMembers", //
] as const;

async function fetchEndpoint(endpoint: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/${endpoint}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export default async function ApiOverview() {
  const results = await Promise.allSettled(
    ENDPOINTS.map((e) =>
      fetchEndpoint(e).then((data) => ({ endpoint: e, data })),
    ),
  );

  return (
    <div className="min-h-screen bg-black/5 text-white p-8 font-mono">
      <h1 className="text-2xl font-bold mb-8 text-orange-400">Guardians API</h1>
      <div className="flex flex-col gap-16 divide-white/20 divide-y">
        {results.map((result, i) => {
          const endpoint = ENDPOINTS[i];
          return (
            <section key={endpoint} className="pb-8">
              <h2 className="text-lg font-semibold mb-2 text-orange-300 uppercase tracking-wider">
                /{endpoint}
              </h2>
              {result.status === "fulfilled" ? (
                <RainbowJSON data={(result.value as { data: unknown }).data} />
              ) : (
                <div className="p-4 bg-zinc-900 rounded-md text-red-400 text-sm">
                  {(result.reason as Error).message}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
