import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ApiChallenge,
  CreateChallengeRequest,
  TemplatesListResponse,
} from "@/lib/types/challenges";

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: () => api.get<TemplatesListResponse>("/templates"),
  });
}

export function useCreateChallenge() {
  return useMutation({
    mutationFn: (data: CreateChallengeRequest) =>
      api.post<ApiChallenge>("/challenges", data),
    onError: (error) => {
      console.error("[createChallenge] error:", error);
    },
  });
}
