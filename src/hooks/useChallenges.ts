import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Challenge } from "@/types";

export function useChallenges() {
  return useQuery<Challenge[]>({
    queryKey: ["challenges"],
    queryFn: () => apiFetch<Challenge[]>("/challenges"),
  });
}
