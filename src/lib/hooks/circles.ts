import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiFetch } from "@/lib/api";
import type { ApiCircle, CreateCircleRequest, CreateCircleResponse, CirclesListResponse } from "@/lib/types/circles";

export function useCircles() {
  return useQuery({
    queryKey: ["circles"],
    queryFn: () => api.get<CirclesListResponse>("/circles"),
  });
}

export function useCircle(circleId: string) {
  return useQuery({
    queryKey: ["circle", circleId],
    queryFn: () => api.get<ApiCircle>(`/circles/${circleId}`),
    enabled: !!circleId,
  });
}

export function useCreateCircle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ metadata, bannerFile }: { metadata: CreateCircleRequest; bannerFile?: File }) => {
      const formData = new FormData();
      formData.append("metadata", JSON.stringify(metadata));
      if (bannerFile) formData.append("bannerFile", bannerFile);
      return apiFetch<CreateCircleResponse>("/createcircle", { method: "POST", body: formData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loginData"] });
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    },
    onError: (error) => {
      console.error("[createCircle] error:", error);
    },
  });
}

export function useJoinCircle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ circleId, userId }: { circleId: string; userId: string }) =>
      apiFetch<void>(`/circles/${circleId}/members`, {
        method: "PUT",
        headers: { "X-User-ID": userId },
      }),
    onSuccess: (_data, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ["loginData"] });
      queryClient.invalidateQueries({ queryKey: ["circle", circleId] });
    },
  });
}

export function useDeleteCircle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (circleId: string) =>
      apiFetch<void>(`/circles/${circleId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loginData"] });
      queryClient.invalidateQueries({ queryKey: ["circles"] });
    },
  });
}

export function useUpdateCircle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      circleId,
      payload,
      bannerFile,
    }: {
      circleId: string;
      payload: Record<string, unknown>;
      bannerFile?: File;
    }) => {
      const formData = new FormData();
      formData.append("metadata", JSON.stringify(payload));
      if (bannerFile) formData.append("bannerFile", bannerFile);
      return apiFetch<ApiCircle>(`/circles/${circleId}`, { method: "PUT", body: formData });
    },
    onSuccess: (_data, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ["circle", circleId] });
      queryClient.invalidateQueries({ queryKey: ["circles"] });
      queryClient.invalidateQueries({ queryKey: ["loginData"] });
    },
  });
}

export function useAssignCircleLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ circleId, userId }: { circleId: string; userId: string }) =>
      apiFetch<void>(`/circles/${circleId}/leads`, {
        method: "PUT",
        headers: { "X-User-ID": userId },
      }),
    onSuccess: (_data, { circleId }) => {
      queryClient.invalidateQueries({ queryKey: ["circle", circleId] });
    },
  });
}
