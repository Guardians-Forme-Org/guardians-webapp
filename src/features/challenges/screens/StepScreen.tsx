"use client";

import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useChallenge, useSubmitEvidence } from "@/lib/hooks/challenges";
import { useUsers } from "@/lib/hooks/users";
import { canManageCircle, isWhitelisted } from "@/lib/permissions";
import type { ApiCircle } from "@/lib/types/circles";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import ChallengeHero from "../components/ChallengeHero";

const SI_UNIT_LABELS: Record<string, string> = {
  MASS: "kg",
  VOLUME: "L",
  AREA: "m²",
  COUNT: "items",
};

type Props = { challengeId: string; stepId: string };

export default function StepScreen({ challengeId, stepId }: Props) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [evidenceForm, setEvidenceForm] = useState({
    volunteerHours: "",
    contributors: [] as string[],
    siUnit: "MASS" as "MASS" | "VOLUME" | "AREA" | "COUNT",
    measurementValue: "",
    description: "",
  });

  const { data: challenge, isLoading } = useChallenge(challengeId);
  const { data: users = [] } = useUsers();
  const { data: circle } = useQuery({
    queryKey: ["circle", challenge?.circleId],
    queryFn: () => api.get<ApiCircle>(`/circles/${challenge!.circleId}`),
    enabled: !!challenge?.circleId,
  });
  const submitEvidence = useSubmitEvidence();

  const step = challenge?.challengeSteps?.find((s) => s.stepId === stepId);

  const canSubmit =
    isWhitelisted(user?.email) ||
    (!!circle && canManageCircle(user?.email, user?.id, circle));

  const isActionable =
    !!step &&
    step.stepType !== "Registration" &&
    step.stepType !== "Completion";

  const progress =
    challenge && challenge.steps > 0
      ? Math.round((challenge.currentStep / challenge.steps) * 100)
      : 0;

  const f = challenge?.facilitator as {
    id?: string;
    userId?: string;
    avatarUrl?: string;
    name?: string;
  } | null;
  const fUser = users.find((u) => u.id === (f?.id ?? f?.userId));
  const fAvatar = f?.avatarUrl || fUser?.user_metadata?.avatarUrl;
  const fName = fUser
    ? [fUser.user_metadata.firstName, fUser.user_metadata.lastName]
        .filter(Boolean)
        .join(" ")
    : (f?.name ?? "Facilitator");

  const handleSubmitEvidence = () => {
    if (!user || !step || !challenge) return;
    submitEvidence.mutate(
      {
        challengeCode: challenge.challengeCode,
        challengeId: challenge.challengeId,
        payload: {
          stepId: step.stepId,
          stepNumber: step.stepNumber,
          challengeCode: challenge.challengeCode,
          circleId: challenge.circleId,
          thingId: challenge.challengeId,
          thingUUID: challenge.impactRecords?.[0]?.thingUUID ?? "",
          submittedBy: user.id,
          approvalRequired: false,
          volunteerHours: {
            value: Number(evidenceForm.volunteerHours) || 0,
            unitOfMeasure: "hours",
            SiUnit: "TIME",
          },
          contributors: evidenceForm.contributors,
          data: {
            measurement: {
              value: Number(evidenceForm.measurementValue) || 0,
              unitofMeasure:
                SI_UNIT_LABELS[evidenceForm.siUnit] ?? evidenceForm.siUnit,
              SiUnit: evidenceForm.siUnit,
            },
            description: evidenceForm.description,
          },
        },
      },
      {
        onSuccess: () => {
          setShowEvidence(false);
          setEvidenceForm({
            volunteerHours: "",
            contributors: [],
            siUnit: "MASS",
            measurementValue: "",
            description: "",
          });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">Loading…</Text>
      </div>
    );
  }

  if (!challenge || !step) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">Step not found.</Text>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col bg-white min-h-full">
        <ChallengeHero bannerUrl={challenge.bannerUrl} heightClass="h-70" />

        <div className="-mt-5 bg-white rounded-t-[20px] relative z-10">
          {/* Identity */}
          <div className="px-10 pt-7.5 pb-0">
            <span className="inline-block bg-[#d9d9d9] rounded-[20px] px-3 py-1 text-[14px] text-text-subheading">
              {circle?.name ?? challenge.circleId}
            </span>
            <h1 className="text-[28px] font-bold text-text-subheading mt-3 leading-tight">
              {step.title}
            </h1>
            <p className="text-base text-[#666] mt-1">Step {step.stepNumber}</p>
          </div>

          {/* Progress + Actions */}
          <div className="px-10 py-7.5 border-t border-progress-track mt-5 flex flex-col gap-10">
            <div className="flex flex-col gap-3">
              <p className="text-xl font-semibold text-text-subheading">
                Progress
              </p>
              <div className="flex items-center gap-5">
                <div className="flex-1 h-2.5 bg-[#e0e0e0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gotf-yellow rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xl text-text-primary font-normal shrink-0">
                  {progress}%
                </p>
              </div>
            </div>

            {canSubmit && isActionable && (
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => setShowEvidence(true)}
                  className="w-full h-12 bg-[#1a1a1a] text-white text-base font-semibold rounded-full"
                >
                  Upload Evidence
                </button>
                <button
                  onClick={() => setShowEvidence(true)}
                  className="w-full h-12 border border-[#1a1a1a] text-[#1a1a1a] text-base font-semibold rounded-full"
                >
                  Mark Complete
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-progress-track" />

          {/* Description */}
          <div className="px-10 py-7.5">
            <p
              className={`text-base text-[#1a1a1a] leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}
            >
              {step.description}
            </p>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-base text-gotf-blue mt-4"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          </div>

          {/* Facilitator */}
          {!!f && (
            <>
              <div className="border-t border-progress-track" />
              <div className="flex items-center gap-5 px-10 py-5">
                <div className="size-10 rounded-full bg-surface border border-border shrink-0 overflow-hidden">
                  {fAvatar && (
                    <img
                      src={fAvatar}
                      alt={fName}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div>
                  <p className="text-xl font-semibold text-text-primary">
                    {fName}
                  </p>
                  <p className="text-base font-medium text-text-secondary">
                    Facilitator
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Activities */}
          {(challenge.impactRecords ?? []).length > 0 && (
            <>
              <div className="border-t border-progress-track" />
              <div className="px-10 py-7.5 flex flex-col gap-8">
                <p className="text-xl font-semibold text-text-subheading">
                  Activities
                </p>
                {(challenge.impactRecords ?? []).map((record) => (
                  <div
                    key={record.impactRecordId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <p className="text-lg font-semibold text-[#1a1a1a]">
                        {record.impactSummary.contribution.displayName}
                      </p>
                      <p className="text-sm text-[#999]">
                        {new Date(record.createdAt).toLocaleDateString(
                          "en-GB",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    <div className="flex -space-x-2">
                      {(challenge.members ?? []).slice(0, 2).map((m) => (
                        <div
                          key={m.userId}
                          className="size-8 rounded-full bg-[#d9d9d9] border-2 border-white overflow-hidden shrink-0"
                        >
                          {m.avatarUrl && (
                            <img
                              src={m.avatarUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Evidence sheet */}
      {showEvidence && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
          onClick={() => setShowEvidence(false)}
        >
          <div
            className="bg-white rounded-t-[20px] max-h-[88dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-[#d9d9d9] rounded-full" />
            </div>
            <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-progress-track">
              <p className="text-lg font-bold text-text-primary">
                Submit Evidence
              </p>
              <button onClick={() => setShowEvidence(false)}>
                <X size={20} className="text-text-muted" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <div className="flex flex-col gap-5 pb-4">
                <div>
                  <p className="text-lg font-bold text-text-primary">
                    {step.title}
                  </p>
                  <p className="text-sm text-text-muted mt-0.5">
                    Step {step.stepNumber}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">
                    Volunteer Hours
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={evidenceForm.volunteerHours}
                    onChange={(e) =>
                      setEvidenceForm((f) => ({
                        ...f,
                        volunteerHours: e.target.value,
                      }))
                    }
                    placeholder="e.g. 3"
                    className="h-11 border border-[rgba(26,26,24,0.28)] rounded-lg px-3 text-base outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">
                    Contributors
                  </label>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto border border-[rgba(26,26,24,0.14)] rounded-lg p-3">
                    {(challenge.members ?? []).map((m) => {
                      const u = users.find((u) => u.id === m.userId);
                      const name = u
                        ? `${u.user_metadata.firstName ?? ""} ${u.user_metadata.lastName ?? ""}`.trim()
                        : m.userId;
                      const checked = evidenceForm.contributors.includes(
                        m.userId,
                      );
                      return (
                        <label
                          key={m.userId}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setEvidenceForm((f) => ({
                                ...f,
                                contributors: checked
                                  ? f.contributors.filter(
                                      (id) => id !== m.userId,
                                    )
                                  : [...f.contributors, m.userId],
                              }))
                            }
                            className="size-4"
                          />
                          <span className="text-sm text-text-primary">
                            {name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">
                    Measurement Type
                  </label>
                  <select
                    value={evidenceForm.siUnit}
                    onChange={(e) =>
                      setEvidenceForm((f) => ({
                        ...f,
                        siUnit: e.target.value as typeof f.siUnit,
                      }))
                    }
                    className="h-11 border border-[rgba(26,26,24,0.28)] rounded-lg px-3 text-base outline-none bg-white"
                  >
                    <option value="MASS">Mass (kg)</option>
                    <option value="VOLUME">Volume (L)</option>
                    <option value="AREA">Area (m²)</option>
                    <option value="COUNT">Count (items)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">
                    Amount ({SI_UNIT_LABELS[evidenceForm.siUnit]})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={evidenceForm.measurementValue}
                    onChange={(e) =>
                      setEvidenceForm((f) => ({
                        ...f,
                        measurementValue: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="h-11 border border-[rgba(26,26,24,0.28)] rounded-lg px-3 text-base outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">
                    Description
                  </label>
                  <textarea
                    value={evidenceForm.description}
                    onChange={(e) =>
                      setEvidenceForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe the activity…"
                    rows={3}
                    className="border border-[rgba(26,26,24,0.28)] rounded-lg px-3 py-2.5 text-base outline-none resize-none"
                  />
                </div>

                <button
                  disabled={submitEvidence.isPending}
                  onClick={handleSubmitEvidence}
                  className="w-full h-12 bg-[#1a1a1a] text-white rounded-full text-base font-semibold disabled:opacity-50 mt-1"
                >
                  {submitEvidence.isPending ? "Submitting…" : "Submit Evidence"}
                </button>

                {submitEvidence.isError && (
                  <p className="text-sm text-red-500 text-center">
                    {submitEvidence.error instanceof Error
                      ? submitEvidence.error.message
                      : "Submission failed. Please try again."}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
