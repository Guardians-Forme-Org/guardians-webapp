import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Circle } from "@/types";

export function useCircle(id: string) {
  return useQuery<Circle>({
    queryKey: ["circles", id],
    queryFn: () => apiFetch<Circle>(`/circles/${id}`),
    enabled: !!id,
  });
}
