import { api, apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
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
  const queryClient = useQueryClient();
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loginData"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
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
      queryClient.invalidateQueries({ queryKey: ["loginData"] });
      queryClient.invalidateQueries({ queryKey: ["challenge", challengeId] });
    },
  });
}

export function useDeleteChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (challengeId: string) =>
      apiFetch<void>(`/challenges/${challengeId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loginData"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
  });
}

type SubmitEvidencePayload = {
  stepId: string;
  stepNumber: number;
  challengeCode: string;
  circleId: string;
  thingId: string;
  thingUUID: string;
  submittedBy: string;
  approvalRequired: boolean;
  volunteerHours: { value: number; unitOfMeasure: string; SiUnit: string };
  contributors: string[];
  data: {
    measurement: { value: number; unitofMeasure: string; SiUnit: string };
    description: string;
  };
};

export function useSubmitEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      challengeCode,
      challengeId,
      stepId,
      userId,
      payload,
    }: {
      challengeCode: string;
      challengeId: string;
      stepId: string;
      userId: string;
      payload: SubmitEvidencePayload;
    }) => {
      const token = getToken();
      const endpoint = `/submit${challengeCode.replace("-", "")}`;
      return apiFetch<void>(endpoint, {
        method: "POST",
        body: payload,
        headers: {
          ...(token ? { Auth: `Bearer ${token}` } : {}),
          "X-Step-ID": stepId,
          "X-User-Id": userId,
        },
      });
    },
    onSuccess: (_data, { challengeId }) => {
      queryClient.invalidateQueries({ queryKey: ["loginData"] });
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
