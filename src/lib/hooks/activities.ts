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

export function useUserRecentActivities(userId: string, limit = DEFAULT_ACTIVITIES_LIMIT) {
  return useQuery({
    queryKey: ["userRecentActivities", userId, limit],
    queryFn: () => api.get<ApiRecentActivity[]>(`/userRecentActivities/${userId}?limit=${limit}`),
    enabled: !!userId,
    placeholderData: keepPreviousData,
  });
}

export const EVIDENCE_SESSION_KEY = (id: string) => `evidence_view_${id}`;
