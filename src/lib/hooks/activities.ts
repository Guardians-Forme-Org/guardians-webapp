import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiRecentActivity } from "@/lib/types/circles";

export const DEFAULT_ACTIVITIES_LIMIT = 3;

export function useRecentActivities(thingId: string, limit = DEFAULT_ACTIVITIES_LIMIT) {
  return useQuery({
    queryKey: ["recentActivities", thingId, limit],
    queryFn: () => api.get<ApiRecentActivity[]>(`/recentActivities/${thingId}?limit=${limit}`),
    enabled: !!thingId,
    placeholderData: keepPreviousData,
  });
}

export function useCircleRecentActivities(circleId: string, limit = DEFAULT_ACTIVITIES_LIMIT) {
  return useQuery({
    queryKey: ["circleRecentActivities", circleId, limit],
    queryFn: () =>
      api.get<ApiRecentActivity[]>(`/circleRecentActivities/${circleId}?limit=${limit}`),
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
