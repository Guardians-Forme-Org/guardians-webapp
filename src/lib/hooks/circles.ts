import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateCircleRequest, CreateCircleResponse } from "@/lib/types/circles";

export function useCreateCircle() {
  return useMutation({
    mutationFn: (data: CreateCircleRequest) =>
      api.post<CreateCircleResponse>("/circles", data),
    onError: (error) => {
      console.error("[createCircle] error:", error);
    },
  });
}
