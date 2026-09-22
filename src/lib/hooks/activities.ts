import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiRecentActivity } from "@/lib/types/circles";

export const DEFAULT_ACTIVITIES_LIMIT = 3;

export function useRecentActivities(thingId: string, limit = DEFAULT_ACTIVITIES_LIMIT) {
  return useQuery({
    queryKey: ["recentActivities", thingId, limit],
    // BE answers an empty list with 404 + [] — treat it as no activities.
    queryFn: () =>
      api
        .get<ApiRecentActivity[]>(`/recentActivities/${thingId}?limit=${limit}`)
        .catch((err: Error) => {
          if (err.message === "API error 404") return [];
          throw err;
        }),
    enabled: !!thingId,
    placeholderData: keepPreviousData,
  });
}

export function useCircleRecentActivities(circleId: string, limit = DEFAULT_ACTIVITIES_LIMIT) {
  return useQuery({
    queryKey: ["circleRecentActivities", circleId, limit],
    // BE answers an empty list with 404 + [] — treat it as no activities.
    queryFn: () =>
      api
        .get<ApiRecentActivity[]>(`/circleRecentActivities/${circleId}?limit=${limit}`)
        .catch((err: Error) => {
          if (err.message === "API error 404") return [];
          throw err;
        }),
    enabled: !!circleId,
    placeholderData: keepPreviousData,
  });
}

export function useUserRecentActivities(userId: string, limit = DEFAULT_ACTIVITIES_LIMIT) {
  return useQuery({
    queryKey: ["userRecentActivities", userId, limit],
    queryFn: () => api.get<ApiRecentActivity[]>(`/userRecentActivities/${userId}?limit=${limit}`),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });
}

export function useEvidence(evidenceId: string) {
  return useQuery({
    queryKey: ["evidence", evidenceId],
    queryFn: () => api.get<ApiRecentActivity>(`/evidences/${evidenceId}`),
    enabled: !!evidenceId,
  });
}
