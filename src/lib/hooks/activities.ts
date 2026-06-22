import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { ApiRecentActivity } from "@/lib/types/circles";

export function useRecentActivities(thingId: string) {
  return useQuery({
    queryKey: ["recentActivities", thingId],
    queryFn: () => api.get<ApiRecentActivity[]>(`/recentActivities/${thingId}`),
    enabled: !!thingId,
  });
}

export function useUserRecentActivities(userId: string) {
  return useQuery({
    queryKey: ["userRecentActivities", userId],
    queryFn: () => api.get<ApiRecentActivity[]>(`/userRecentActivities/${userId}`),
    enabled: !!userId,
  });
}
