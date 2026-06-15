"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ChallengeHero from "../components/ChallengeHero";
import Text from "@/components/ui/Text";
import { useChallenge } from "@/lib/hooks/challenges";
import { api } from "@/lib/api";
import type { ApiCircle, ApiCircleChallenge } from "@/lib/types/circles";

// ── Sub-components ─────────────────────────────────────────────────────────────

function JoinChallengeButton() {
  return (
    <button className="px-5 h-10 bg-linear-to-r from-[#008000] to-[#129612] text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
      Join Challenge
    </button>
  );
}

function HomeTab({ challenge, circleName }: { challenge: ApiCircleChallenge; circleName?: string }) {
  const [expanded, setExpanded] = useState(false);
  const progress = challenge.steps > 0
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
                <span className="font-semibold text-text-primary">{challenge.location.city}</span>
                {challenge.location.province ? `, ${challenge.location.province}` : ""}
              </p>
            </div>
          </div>
          <div className="border-t border-progress-track" />
        </>
      )}

      {/* Description */}
      <div className="px-10 py-5">
        <p className={`text-base text-[#666] leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}>
          {challenge.description}
        </p>
        <button onClick={() => setExpanded((v) => !v)} className="text-base text-gotf-blue mt-2">
          {expanded ? "Show less" : "Show more"}
        </button>
      </div>

      <div className="border-t border-progress-track" />

      {/* Progress */}
      <div className="px-10 py-7.5 flex flex-col gap-4">
        <Text variant="subheading" className="font-semibold text-[20px]">Progress</Text>
        <div className="flex items-center gap-5">
          <div className="flex-1 h-2.5 bg-[#e0e0e0] rounded-full overflow-hidden">
            <div className="h-full bg-gotf-yellow rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xl text-text-primary font-normal shrink-0">{progress}%</p>
        </div>
      </div>

      <div className="border-t border-progress-track" />

      {/* Facilitator */}
      {!!challenge.facilitator && (
        <>
          <div className="flex items-center gap-5 px-7.5 py-5">
            <div className="size-10 rounded-full bg-surface border border-border shrink-0" />
            <div>
              <p className="text-xl font-semibold text-text-primary">Facilitator</p>
            </div>
          </div>
          <div className="border-t border-progress-track" />
        </>
      )}

      {/* Members */}
      {(challenge.members ?? []).length > 0 && (
        <>
          <div className="py-7.5">
            <div className="flex items-center justify-between px-7.5 mb-5">
              <p className="text-xl font-bold text-text-subheading">
                <span className="font-normal">by </span>
                <Link href={`/circles/${challenge.circleId}`} className="text-gotf-blue">
                  {circleName ?? challenge.circleId}
                </Link>
              </p>
            </div>

            <div className="flex justify-between px-7.5 mb-6">
              {(challenge.members ?? []).slice(0, 5).map((member) => (
                <div key={member.userId} className="flex flex-col items-center gap-2">
                  <div className="size-16 rounded-full bg-[#d9d9d9] border-2 border-white overflow-hidden">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <Text variant="caption" className="text-text-subheading capitalize">
                    {member.role.toLowerCase().replace(/_/g, " ")}
                  </Text>
                </div>
              ))}
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
      {(challenge.impactRecords ?? []).map((record) => (
          <div key={record.impactRecordId} className="flex border-b border-progress-track">
            <div className="flex-1 flex flex-col gap-2 px-10 pt-6 pb-7.5 border-r border-[#e6e6e6]">
              <Text variant="caption" className="text-text-muted">
                {record.impactSummary.contribution.unitOfMeasure} contributed
              </Text>
              <p className="text-2xl font-semibold text-text-subheading">
                {record.impactSummary.contribution.displayName}
              </p>
            </div>
            <div className="flex-1 flex flex-col gap-2 px-5 pt-6 pb-7.5">
              <Text variant="caption" className="text-text-muted">
                {record.impactSummary.impact.unitOfMeasure} impact
              </Text>
              <p className="text-2xl font-semibold text-text-subheading">
                {record.impactSummary.impact.displayName}
              </p>
            </div>
          </div>
        ))
      }

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

type Props = { challengeId: string };

export default function ChallengeScreen({ challengeId }: Props) {
  const [tab, setTab] = useState<"home" | "activities">("home");
  const { data: challenge, isLoading, error } = useChallenge(challengeId);
  const { data: circle } = useQuery({
    queryKey: ["circle", challenge?.circleId],
    queryFn: () => api.get<ApiCircle>(`/circles/${challenge!.circleId}`),
    enabled: !!challenge?.circleId,
  });

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
          <div className="mt-3">
            <JoinChallengeButton />
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

        {tab === "home" ? <HomeTab challenge={challenge} circleName={circle?.name} /> : <ActivitiesTab />}
      </div>
    </div>
  );
}
