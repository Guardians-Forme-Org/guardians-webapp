import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Circle } from "@/types";

export function useCircle(id: string) {
  const queryClient = useQueryClient();

  return useQuery<Circle>({
    queryKey: ["circles", id],
    queryFn: () => apiFetch<Circle>(`/circles/${id}`),
    enabled: !!id,
    // Seed from the list cache while the API fetch is in-flight
    initialData: () => {
      const list = queryClient.getQueryData<Circle[]>(["circles"]);
      return list?.find((c) => c.id === id);
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(["circles"])?.dataUpdatedAt,
    retry: false,
  });
}
