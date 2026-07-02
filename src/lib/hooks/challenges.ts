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
    measurement?: { value: number; unitofMeasure: string; siUnit: string };
    description: string;
  };
};

export type SubmitEvidenceResponse = {
  impactSummary?: {
    contribution?: { value: number; unitOfMeasure: string; displayName: string };
    impact?: {
      value: number;
      unitOfMeasure: string;
      displayName: string;
      siUnit: string;
      shortSummary?: string;
      summary?: string;
    };
  };
  message?: string;
  volunteerHours?: { value: number; unitOfMeasure: string; siUnit: string };
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
      const endpoint = `/submit${challengeCode.replace("-", "")}`;
      return apiFetch<SubmitEvidenceResponse>(endpoint, {
        method: "POST",
        body: payload,
        headers: {
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

export function useUpdateEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      evidenceId,
      challengeId,
      stepId,
      userId,
      payload,
    }: {
      evidenceId: string;
      challengeId: string;
      stepId: string;
      userId: string;
      payload: SubmitEvidencePayload;
    }) => {
      return apiFetch<SubmitEvidenceResponse>(`/evidences/${evidenceId}`, {
        method: "PUT",
        body: payload,
        headers: {
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

export function useUpdateChallenge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      challengeId,
      payload,
      bannerFile,
    }: {
      challengeId: string;
      payload: Record<string, unknown>;
      bannerFile?: File;
    }) => {
      const formData = new FormData();
      formData.append("metadata", JSON.stringify(payload));
      if (bannerFile) formData.append("bannerFile", bannerFile);
      return apiFetch<ApiCircleChallenge>(`/challenges/${challengeId}`, {
        method: "PUT",
        body: formData,
      });
    },
    onSuccess: (_data, { challengeId }) => {
      queryClient.invalidateQueries({ queryKey: ["challenge", challengeId] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
      queryClient.invalidateQueries({ queryKey: ["loginData"] });
    },
  });
}

type RegistrationPayload = {
  stepId: string;
  circleId: string;
  stepNumber: number;
  stepType: string;
  challengeCode: string;
  challengeId: string;
  submittedBy: string;
  volunteerHours: { value: number; unitOfMeasure: string; siUnit: string };
  contributors: string[];
  data: {
    unitOfMeasure: "LOCATION";
    currentActivity: string;
    permission: { obtained: boolean; holder: string };
    currentCondition: string;
    measurement: { value: number; unitOfMeasure: string; siUnit: "AREA" };
    location: Record<string, unknown> | null;
  };
};

export function useSubmitRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      challengeCode,
      challengeId,
      stepId,
      userId,
      payload,
      mediaFile,
    }: {
      challengeCode: string;
      challengeId: string;
      stepId: string;
      userId: string;
      payload: RegistrationPayload;
      mediaFile?: File;
    }) => {
      const formData = new FormData();
      formData.append("metadata", JSON.stringify(payload));
      if (mediaFile) formData.append("mediaFile", mediaFile);
      return apiFetch<void>("/challengeSetup", {
        method: "POST",
        body: formData,
        headers: {
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

type MarkStepCompletePayload = {
  stepNumber: number;
  stepType: string;
  stepId: string;
  title: string;
  description: string;
  isCompleted: boolean;
};

export function useMarkStepComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      challengeId,
      step,
    }: {
      challengeId: string;
      step: MarkStepCompletePayload;
    }) =>
      apiFetch<void>(`/challenges/${challengeId}/steps`, {
        method: "PUT",
        body: step,
        headers: { "X-Step-ID": step.stepId },
      }),
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
