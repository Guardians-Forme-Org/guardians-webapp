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

// Impact records for one thing — a userId is a thingId. Same envelope that
// /users/{id} embeds as impactRecords, read directly: it's the one call that
// answers "what has this guardian earned", so the profile's numbers don't have
// to ride on the heavy user aggregate (circles + challenges + markers).
// 500s with "No impact record found" until the first impact is credited — a
// normal state for a new guardian, so don't retry it; callers fall back.
export function useThingImpactRecords(thingId: string | null | undefined) {
  return useQuery({
    queryKey: ["thingImpactRecords", thingId],
    queryFn: () => api.get<ApiImpactRecord[]>(`/thingImpactRecords/${thingId}`),
    enabled: !!thingId,
    retry: false,
  });
}

export function usePublicMetrics() {
  return useQuery({
    queryKey: ["publicMatrix"],
    queryFn: () => api.get<PublicMetricsResponse>("/publicMatrix"),
    staleTime: 2 * 60 * 1000,
  });
}
