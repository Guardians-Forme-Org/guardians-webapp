import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateCircleRequest, CreateCircleResponse, CirclesListResponse } from "@/lib/types/circles";

export function useCircles() {
  return useQuery({
    queryKey: ["circles"],
    queryFn: () => api.get<CirclesListResponse>("/circles"),
  });
}

export function useCreateCircle() {
  return useMutation({
    mutationFn: (data: CreateCircleRequest) =>
      api.post<CreateCircleResponse>("/circles", data),
    onError: (error) => {
      console.error("[createCircle] error:", error);
    },
  });
}
