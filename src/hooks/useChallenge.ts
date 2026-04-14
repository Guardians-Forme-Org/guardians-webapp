import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Challenge } from "@/types";

export function useChallenge(id: string) {
  return useQuery<Challenge>({
    queryKey: ["challenges", id],
    queryFn: () => apiFetch<Challenge>(`/challenges/${id}`),
    enabled: !!id,
  });
}
