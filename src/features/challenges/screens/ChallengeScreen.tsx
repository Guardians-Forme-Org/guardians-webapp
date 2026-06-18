"use client";

import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useChallenge, useDeleteChallenge, useJoinChallenge, useSubmitEvidence } from "@/lib/hooks/challenges";
import { useUsers } from "@/lib/hooks/users";
import { canManageCircle, isWhitelisted } from "@/lib/permissions";
import type { ApiCircle, ApiCircleChallenge } from "@/lib/types/circles";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, MapPin, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ChallengeHero from "../components/ChallengeHero";

function HomeTab({
  challenge,
  circleName,
}: {
  challenge: ApiCircleChallenge;
  circleName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: users = [] } = useUsers();
  const progress =
    challenge.steps > 0
      ? Math.round((challenge.currentStep / challenge.steps) * 100)
      : 0;

  return (
    <>
      {/* Location */}
      {challenge.location && (
        <>
          <div className="px-10 py-5">
            <div className="flex items-center gap-1.5">
              <MapPin size={16} className="text-gotf-green shrink-0" />
              <p className="text-base text-[#666]">
                <span className="font-semibold text-text-primary">
                  {challenge.location.city}
                </span>
                {challenge.location.province
                  ? `, ${challenge.location.province}`
                  : ""}
              </p>
            </div>
          </div>
          <div className="border-t border-progress-track" />
        </>
      )}

      {/* Description */}
      <div className="px-10 py-5">
        <p
          className={`text-base text-[#666] leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}
        >
          {challenge.description}
        </p>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-base text-gotf-blue mt-2"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      </div>

      <div className="border-t border-progress-track" />

      {/* Progress */}
      <div className="px-10 py-7.5 flex flex-col gap-4">
        <Text variant="subheading" className="font-semibold text-[20px]">
          Progress
        </Text>
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

      <div className="border-t border-progress-track" />

      {/* Facilitator */}
      {!!challenge.facilitator && (() => {
        const f = challenge.facilitator as { id?: string; userId?: string; avatarUrl?: string; name?: string } | null;
        const fUser = users.find((u) => u.id === (f?.id ?? f?.userId));
        const fAvatar = f?.avatarUrl || fUser?.user_metadata?.avatarUrl;
        const fName = fUser
          ? [fUser.user_metadata.firstName, fUser.user_metadata.lastName].filter(Boolean).join(" ")
          : (f?.name ?? "Facilitator");
        return (
          <>
            <div className="flex items-center gap-5 px-7.5 py-5">
              <div className="size-10 rounded-full bg-surface border border-border shrink-0 overflow-hidden">
                {fAvatar && <img src={fAvatar} alt={fName} className="w-full h-full object-cover" />}
              </div>
              <div>
                <p className="text-xl font-semibold text-text-primary">{fName}</p>
                <p className="text-base font-medium text-text-secondary">Facilitator</p>
              </div>
            </div>
            <div className="border-t border-progress-track" />
          </>
        );
      })()}

      {/* Members */}
      {(challenge.members ?? []).length > 0 && (
        <>
          <div className="py-7.5">
            <div className="flex items-center justify-between px-7.5 mb-5">
              <p className="text-xl font-bold text-text-subheading">
                <span className="font-normal">by </span>
                <Link
                  href={`/circles/${challenge.circleId}`}
                  className="text-gotf-blue"
                >
                  {circleName ?? challenge.circleId}
                </Link>
              </p>
            </div>

            <div className="flex gap-2 px-7.5 mb-6">
              {(challenge.members ?? []).slice(0, 5).map((member) => {
                const memberUser = users.find((u) => u.id === member.userId);
                const name = memberUser ? `${memberUser.user_metadata.firstName ?? ""}`.trim() || member.userId : member.userId;
                const av = member.avatarUrl || memberUser?.user_metadata?.avatarUrl;
                return (
                <div
                  key={member.userId}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="size-16 rounded-full bg-[#d9d9d9] border-2 border-white overflow-hidden">
                    {av ? (
                      <img
                        src={av}
                        alt={name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <Text
                    variant="caption"
                    className="text-text-subheading"
                  >
                    {name.split(" ")[0]}
                  </Text>
                </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button className="px-5 h-12 bg-[#1a1a1a] text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
                Join Conversation
              </button>
            </div>
          </div>
          <div className="border-t border-progress-track" />
        </>
      )}

      {/* Impact */}
      <div className="border-t border-progress-track">
        <p className="px-10 pt-7.5 pb-5 text-xl font-bold text-text-subheading">
          Impact
        </p>
        {!(challenge.impactRecords ?? []).length ? (
          <p className="px-10 pb-7.5 text-sm text-text-muted">
            No impact recorded yet.
          </p>
        ) : (
          (challenge.impactRecords ?? []).map((record) => (
            <div
              key={record.impactRecordId}
              className="flex items-start gap-4 px-10 pb-6 border-t border-[#e6e6e6]"
            >
              <div className="flex-1 pt-5">
                <p className="text-2xl font-semibold text-[#333]">
                  {record.impactSummary.impact.displayName}
                </p>
                <p className="text-xs text-[#767676] mt-1 leading-snug">
                  {record.impactSummary.impact.summary}
                </p>
              </div>
              <div className="pt-5 text-right shrink-0">
                <p className="text-base font-semibold text-text-subheading">
                  {record.impactSummary.contribution.displayName}
                </p>
                <p className="text-xs text-text-muted mt-0.5">contributed</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Steps summary */}
      <div className="py-7.5 px-10">
        <p className="text-xl font-semibold text-text-subheading mb-2">Steps</p>
        <p className="text-base text-text-muted">
          Step {challenge.currentStep} of {challenge.steps} completed
        </p>
      </div>
    </>
  );
}

function ActivitiesTab() {
  return (
    <div className="px-10 py-7.5">
      <p className="text-sm text-text-muted">No activities yet.</p>
    </div>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

type ChallengeStep = { stepNumber: number; stepType: string; stepId: string; title: string; description: string };

const SI_UNIT_LABELS: Record<string, string> = {
  MASS: "kg",
  VOLUME: "L",
  AREA: "m²",
  COUNT: "items",
};

type Props = { challengeId: string };

export default function ChallengeScreen({ challengeId }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"home" | "activities">("home");
  const [showEvidence, setShowEvidence] = useState(false);
  const [evidenceStep, setEvidenceStep] = useState<ChallengeStep | null>(null);
  const [evidenceForm, setEvidenceForm] = useState({
    volunteerHours: "",
    contributors: [] as string[],
    siUnit: "MASS" as "MASS" | "VOLUME" | "AREA" | "COUNT",
    measurementValue: "",
    description: "",
  });
  const joinChallenge = useJoinChallenge();
  const deleteChallenge = useDeleteChallenge();
  const submitEvidence = useSubmitEvidence();
  const isAdmin = isWhitelisted(user?.email);
  const { data: users = [] } = useUsers();
  const { data: challenge, isLoading, error } = useChallenge(challengeId);
  const { data: circle } = useQuery({
    queryKey: ["circle", challenge?.circleId],
    queryFn: () => api.get<ApiCircle>(`/circles/${challenge!.circleId}`),
    enabled: !!challenge?.circleId,
  });

  const canSubmit =
    isWhitelisted(user?.email) ||
    (!!circle && canManageCircle(user?.email, user?.id, circle));

  const submittableSteps = (challenge?.challengeSteps ?? []).filter(
    (s) => s.stepType !== "Registration" && s.stepType !== "Completion"
  ) as ChallengeStep[];

  const handleSubmitEvidence = () => {
    if (!user || !evidenceStep || !challenge) return;
    submitEvidence.mutate(
      {
        challengeCode: challenge.challengeCode,
        challengeId: challenge.challengeId,
        payload: {
          stepId: evidenceStep.stepId,
          stepNumber: evidenceStep.stepNumber,
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
              unitofMeasure: SI_UNIT_LABELS[evidenceForm.siUnit] ?? evidenceForm.siUnit,
              SiUnit: evidenceForm.siUnit,
            },
            description: evidenceForm.description,
          },
        },
      },
      {
        onSuccess: () => {
          setShowEvidence(false);
          setEvidenceStep(null);
          setEvidenceForm({ volunteerHours: "", contributors: [], siUnit: "MASS", measurementValue: "", description: "" });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">Loading…</Text>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">Challenge not found.</Text>
      </div>
    );
  }

  const since = new Date(challenge.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  return (
    <>
    <div className="flex flex-col bg-white min-h-full">
      <ChallengeHero bannerUrl={challenge.bannerUrl} />

      <div className="-mt-5 bg-white rounded-t-[20px] relative z-10">
        {/* Identity */}
        <div className="px-10 pt-7.5 pb-0">
          <span className="inline-block bg-[#d9d9d9] rounded-[20px] px-3 py-1 text-[14px] text-text-subheading">
            {circle?.name ?? challenge.circleId}
          </span>
          <h1 className="text-[28px] font-bold text-text-subheading mt-3 leading-tight">
            {challenge.name}
          </h1>
          <p className="text-base text-[#666] mt-1">Since {since}</p>
          <div className="mt-3 flex items-center gap-3">
            {(() => {
              const isMember =
                !!user &&
                (challenge.members ?? []).some((m) => m.userId === user.id);
              const isPending = joinChallenge.isPending;
              const isDisabled = isMember || isPending;
              return (
                <button
                  disabled={isDisabled}
                  onClick={() => {
                    if (!user) return;
                    joinChallenge.mutate({ challengeId, userId: user.id });
                  }}
                  className={`px-5 h-10 text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)] transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    isMember
                      ? "bg-[#333] w-40"
                      : "bg-linear-to-r from-[#008000] to-[#129612]"
                  }`}
                >
                  {isMember
                    ? "Joined"
                    : isPending
                      ? "Joining…"
                      : "Join Challenge"}
                </button>
              );
            })()}
            {canSubmit && submittableSteps.length > 0 && (
              <button
                onClick={() => setShowEvidence(true)}
                className="px-5 h-10 text-base font-semibold rounded-full border border-[#1a1a1a] text-[#1a1a1a] shadow-[0_2px_10px_rgba(0,0,0,0.08)]"
              >
                Submit Evidence
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex px-10 mt-5">
          {(["home", "activities"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 h-10 flex items-center text-base capitalize transition-colors ${
                tab === t
                  ? "border-b-2 border-[#303030] text-[#303030] font-medium"
                  : "text-text-muted"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="border-t border-progress-track" />

        {tab === "home" ? (
          <HomeTab challenge={challenge} circleName={circle?.name} />
        ) : (
          <ActivitiesTab />
        )}

        {/* Danger zone */}
        {isAdmin && (
          <div className="px-7.5 pt-4 pb-10">
            <button
              disabled={deleteChallenge.isPending}
              onClick={() => {
                if (!window.confirm(`Delete challenge "${challenge.name}"? This cannot be undone.`)) return;
                deleteChallenge.mutate(challenge.challengeId, { onSuccess: () => router.back() });
              }}
              className="flex items-center gap-2 px-4 h-10 rounded-full border border-red-300 text-sm font-medium text-red-500 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deleteChallenge.isPending ? "Deleting…" : "Delete Challenge"}
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Submit Evidence sheet */}
    {showEvidence && (
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
        onClick={() => { setShowEvidence(false); setEvidenceStep(null); }}
      >
        <div
          className="bg-white rounded-t-[20px] max-h-[88dvh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-[#d9d9d9] rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-progress-track">
            {evidenceStep ? (
              <button
                onClick={() => setEvidenceStep(null)}
                className="flex items-center gap-1 text-sm text-text-muted"
              >
                <ChevronLeft size={16} /> Back
              </button>
            ) : (
              <p className="text-lg font-bold text-text-primary">Submit Evidence</p>
            )}
            <button onClick={() => { setShowEvidence(false); setEvidenceStep(null); }}>
              <X size={20} className="text-text-muted" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 px-6 py-5">
            {!evidenceStep ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-text-muted mb-1">Choose the step to submit evidence for:</p>
                {submittableSteps.map((step) => (
                  <button
                    key={step.stepId}
                    onClick={() => setEvidenceStep(step)}
                    className="flex items-center justify-between p-4 border border-[rgba(26,26,24,0.14)] rounded-xl text-left"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">Step {step.stepNumber}</p>
                      <p className="text-sm text-text-muted mt-0.5">{step.title}</p>
                    </div>
                    <ChevronRight size={16} className="text-text-muted shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-5 pb-4">
                <div>
                  <p className="text-lg font-bold text-text-primary">{evidenceStep.title}</p>
                  <p className="text-sm text-text-muted mt-0.5">Step {evidenceStep.stepNumber}</p>
                </div>

                {/* Volunteer Hours */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">Volunteer Hours</label>
                  <input
                    type="number"
                    min={0}
                    value={evidenceForm.volunteerHours}
                    onChange={(e) => setEvidenceForm((f) => ({ ...f, volunteerHours: e.target.value }))}
                    placeholder="e.g. 3"
                    className="h-11 border border-[rgba(26,26,24,0.28)] rounded-lg px-3 text-base outline-none"
                  />
                </div>

                {/* Contributors */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">Contributors</label>
                  <div className="flex flex-col gap-2 max-h-40 overflow-y-auto border border-[rgba(26,26,24,0.14)] rounded-lg p-3">
                    {(challenge.members ?? []).map((m) => {
                      const u = users.find((u) => u.id === m.userId);
                      const name = u
                        ? `${u.user_metadata.firstName ?? ""} ${u.user_metadata.lastName ?? ""}`.trim()
                        : m.userId;
                      const checked = evidenceForm.contributors.includes(m.userId);
                      return (
                        <label key={m.userId} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              setEvidenceForm((f) => ({
                                ...f,
                                contributors: checked
                                  ? f.contributors.filter((id) => id !== m.userId)
                                  : [...f.contributors, m.userId],
                              }))
                            }
                            className="size-4"
                          />
                          <span className="text-sm text-text-primary">{name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Measurement Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">Measurement Type</label>
                  <select
                    value={evidenceForm.siUnit}
                    onChange={(e) =>
                      setEvidenceForm((f) => ({ ...f, siUnit: e.target.value as typeof f.siUnit }))
                    }
                    className="h-11 border border-[rgba(26,26,24,0.28)] rounded-lg px-3 text-base outline-none bg-white"
                  >
                    <option value="MASS">Mass (kg)</option>
                    <option value="VOLUME">Volume (L)</option>
                    <option value="AREA">Area (m²)</option>
                    <option value="COUNT">Count (items)</option>
                  </select>
                </div>

                {/* Measurement Value */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">
                    Amount ({SI_UNIT_LABELS[evidenceForm.siUnit]})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={evidenceForm.measurementValue}
                    onChange={(e) => setEvidenceForm((f) => ({ ...f, measurementValue: e.target.value }))}
                    placeholder="0"
                    className="h-11 border border-[rgba(26,26,24,0.28)] rounded-lg px-3 text-base outline-none"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">Description</label>
                  <textarea
                    value={evidenceForm.description}
                    onChange={(e) => setEvidenceForm((f) => ({ ...f, description: e.target.value }))}
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
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
}
