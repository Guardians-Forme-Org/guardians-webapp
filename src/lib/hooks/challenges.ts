import { api, apiFetch } from "@/lib/api";
import type {
  ApiChallenge,
  CreateChallengeRequest,
  TemplatesListResponse,
} from "@/lib/types/challenges";
import type { ApiCircleChallenge } from "@/lib/types/circles";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
    mutationFn: ({
      metadata,
      bannerFile,
    }: {
      metadata: CreateChallengeRequest;
      bannerFile?: File;
    }) => {
      const formData = new FormData();
      formData.append("metadata", JSON.stringify(metadata));
      if (bannerFile) formData.append("bannerFile", bannerFile);
      return apiFetch<ApiChallenge>("/createchallenge", {
        method: "POST",
        body: formData,
      });
    },
    onError: (error) => {
      console.error("[createChallenge] error:", error);
    },
  });
}

export function useJoinChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      challengeId,
      userId,
    }: {
      challengeId: string;
      userId: string;
    }) =>
      apiFetch<void>(`/challenges/${challengeId}/members`, {
        method: "PUT",
        headers: { "X-User-ID": userId },
      }),
    onSuccess: (_data, { challengeId }) => {
      queryClient.invalidateQueries({ queryKey: ["challenge", challengeId] });
    },
  });
}

export function useAssignChallengeFacilitator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      challengeId,
      userId,
    }: {
      challengeId: string;
      userId: string;
    }) =>
      apiFetch<void>(`/challenges/${challengeId}/facilitators`, {
        method: "PUT",
        headers: { "X-User-ID": userId },
      }),
    onSuccess: (_data, { challengeId }) => {
      queryClient.invalidateQueries({ queryKey: ["challenge", challengeId] });
    },
  });
}
