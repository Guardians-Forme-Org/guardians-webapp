import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  ApiChallenge,
  CreateChallengeRequest,
  TemplatesListResponse,
} from "@/lib/types/challenges";
import type { ApiCircleChallenge } from "@/lib/types/circles";

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: () => api.get<TemplatesListResponse>("/templates"),
  });
}

export function useChallenges() {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: () => api.get<ApiCircleChallenge[]>("/challenges"),
  });
}

export function useChallenge(challengeId: string) {
  return useQuery({
    queryKey: ["challenge", challengeId],
    queryFn: () => api.get<ApiCircleChallenge>(`/challenges/${challengeId}`),
    enabled: !!challengeId,
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
