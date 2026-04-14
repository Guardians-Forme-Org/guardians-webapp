import { useQuery } from "@tanstack/react-query";
import type { AdminReport } from "@/types";

// Admin reports endpoint is not live yet — stub returns empty array
function fetchAdminQueue(): Promise<AdminReport[]> {
  return Promise.resolve([]);
}

export function useAdminQueue() {
  return useQuery<AdminReport[]>({
    queryKey: ["admin", "queue"],
    queryFn: fetchAdminQueue,
  });
}
