import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Circle } from "@/types";

export function useCircles() {
  return useQuery<Circle[]>({
    queryKey: ["circles"],
    queryFn: () => apiFetch<Circle[]>("/circles"),
  });
}
