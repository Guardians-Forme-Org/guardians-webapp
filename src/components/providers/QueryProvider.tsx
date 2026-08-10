"use client";

import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => {
    let client: QueryClient;
    client = new QueryClient({
      mutationCache: new MutationCache({
        onSuccess: () => {
          // Immediate invalidation is handled per-hook.
          // This delayed refetch catches backend propagation lag so loginData
          // reflects joins/updates even when the API hasn't committed yet.
          setTimeout(() => {
            client.refetchQueries({ queryKey: ["loginData"] });
          }, 2500);
        },
      }),
      defaultOptions: {
        queries: { staleTime: 60_000, retry: 1 },
      },
    });
    return client;
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
