import { api } from "@/lib/api";
import type { ApiImpactRecord } from "@/lib/types/circles";
import { useQuery } from "@tanstack/react-query";

export type ThingsMatrixItem = {
  count: number;
  name: string;
  region: string;
  displayValue: string;
  label: string;
};

export type PublicMetricsResponse = {
  impactMatrix: ApiImpactRecord[];
  thingsMatrix: ThingsMatrixItem[];
};

export function usePublicMetrics() {
  return useQuery({
    queryKey: ["publicMatrix"],
    queryFn: () => api.get<PublicMetricsResponse>("/publicMatrix"),
    staleTime: 2 * 60 * 1000,
  });
}
