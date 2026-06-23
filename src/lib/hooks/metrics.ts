import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export type PublicMetric = {
  count: number;
  name: string;
  region: string;
  displayValue: string;
  label: string;
};

export function usePublicMetrics() {
  return useQuery({
    queryKey: ["publicMatrix"],
    queryFn: () => api.get<PublicMetric[]>("/publicMatrix"),
  });
}
