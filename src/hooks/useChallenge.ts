import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Challenge } from "@/types";

export function useChallenge(id: string) {
  const queryClient = useQueryClient();

  return useQuery<Challenge>({
    queryKey: ["challenges", id],
    queryFn: () => apiFetch<Challenge>(`/challenges/${id}`),
    enabled: !!id,
    // Seed from the list cache — survives even if the single-fetch endpoint is unimplemented
    initialData: () => {
      const list = queryClient.getQueryData<Challenge[]>(["challenges"]);
      return list?.find((c) => c.id === id);
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(["challenges"])?.dataUpdatedAt,
    retry: false,
  });
}
