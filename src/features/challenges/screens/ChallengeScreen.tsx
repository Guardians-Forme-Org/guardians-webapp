"use client";

import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useChallenge, useJoinChallenge } from "@/lib/hooks/challenges";
import { useUsers } from "@/lib/hooks/users";
import type { ApiCircle, ApiCircleChallenge, ApiImpactRecord, ApiCircleChallengeMember } from "@/lib/types/circles";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ChallengeHero from "../components/ChallengeHero";

function HomeTab({
  challenge,
  challengeId,
  circleName,
}: {
  challenge: ApiCircleChallenge;
  challengeId: string;
  circleName?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const { data: users = [] } = useUsers();
  const progress =
    challenge.steps > 0
      ? Math.round((challenge.currentStep / challenge.steps) * 100)
      : 0;
  const members = challenge.members ?? [];

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
      {members.length > 0 && (
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
              {members.length > 5 && (
                <button
                  onClick={() => setShowAllMembers((v) => !v)}
                  className="text-base text-gotf-blue"
                >
                  {showAllMembers ? "Show less" : `See all (${members.length})`}
                </button>
              )}
            </div>

            <div className={`flex px-7.5 mb-6 gap-2 ${showAllMembers ? "flex-wrap gap-y-6" : ""}`}>
              {(showAllMembers ? members : members.slice(0, 5)).map((member) => {
                const memberUser = users.find((u) => u.id === member.userId);
                const name = memberUser ? `${memberUser.user_metadata.firstName ?? ""}`.trim() || member.userId : member.userId;
                const av = member.avatarUrl || memberUser?.user_metadata?.avatarUrl;
                return (
                  <div key={member.userId} className="flex flex-col items-center gap-2 w-16">
                    <div className="size-16 rounded-full bg-[#d9d9d9] border-2 border-white overflow-hidden">
                      {av && <img src={av} alt={name} className="w-full h-full object-cover" />}
                    </div>
                    <Text variant="caption" className="text-text-subheading text-center leading-tight">
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
      {(challenge.impactRecords ?? []).length > 0 && (
        <div className="border-t border-[#e6e6e6]">
          <div className="grid grid-cols-2">
            {(challenge.impactRecords ?? []).map((record, i) => (
              <div
                key={record.impactRecordId}
                className={`border-b border-[#e6e6e6] pt-6 pb-7.5 flex flex-col gap-2 ${i % 2 === 0 ? "px-10 border-r border-[#e6e6e6]" : "px-5"}`}
              >
                <p className="text-[12px] text-[#767676] leading-snug">
                  {record.impactSummary.impact.summary}
                </p>
                <p className="text-2xl font-semibold text-[#333]">
                  {record.impactSummary.impact.displayName}
                </p>
                <p className="text-[11px] text-text-muted">
                  {record.impactSummary.contribution.displayName} contributed
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {(challenge.challengeSteps ?? []).length > 0 && (
        <div className="border-t border-progress-track py-7.5">
          <p className="px-10 text-xl font-semibold text-text-subheading mb-5">Steps</p>
          <div className="flex flex-col gap-3 px-6">
            {(challenge.challengeSteps ?? []).map((step) => (
              <Link
                key={step.stepId}
                href={`/challenges/${challengeId}/steps/${step.stepId}`}
                className="flex items-center gap-4 border border-[#eee] rounded-[10px] px-4 py-2.5"
              >
                <p className="text-base font-medium text-black w-3 shrink-0 text-center">{step.stepNumber}</p>
                <div className="size-[60px] rounded-[8px] bg-[#eee] shrink-0" />
                <div className="flex-1 min-w-0 px-1">
                  <p className="text-base font-semibold text-[#1a1a1a] truncate">{step.title}</p>
                  <p className="text-[12px] text-[#1a1a1a] truncate">{step.description}</p>
                  {step.stepType && (
                    <p className="text-[12px] text-[#999]">{step.stepType}</p>
                  )}
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function ActivitiesTab({
  impactRecords,
  members,
}: {
  impactRecords: ApiImpactRecord[];
  members: ApiCircleChallengeMember[];
}) {
  if (impactRecords.length === 0) {
    return (
      <div className="px-10 py-7.5">
        <p className="text-sm text-text-muted">No activities yet.</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-7.5 flex flex-col gap-6">
      {impactRecords.map((record) => (
        <div key={record.impactRecordId} className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-[#1a1a1a]">
              {record.impactSummary.contribution.displayName}
            </p>
            <p className="text-sm text-[#999]">
              {new Date(record.modifiedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 2).map((m) => (
              <div
                key={m.userId}
                className="size-8 rounded-full bg-[#d9d9d9] border-2 border-white overflow-hidden shrink-0"
              >
                {m.avatarUrl && (
                  <img src={m.avatarUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

type Props = { challengeId: string };

export default function ChallengeScreen({ challengeId }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"home" | "activities">("home");
  const joinChallenge = useJoinChallenge();
  const { data: users = [] } = useUsers();
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
    <>
    <div className="flex flex-col bg-white min-h-full">
      <ChallengeHero bannerUrl={challenge.bannerUrl} />

      <div className="-mt-5 bg-white rounded-t-[20px] relative z-10">
        {/* Identity */}
        <div className="px-10 pt-7.5 pb-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-block bg-[#d9d9d9] rounded-[20px] px-3 py-1 text-[14px] text-text-subheading">
              {circle?.name ?? challenge.circleId}
            </span>
            {challenge.template?.targetSDG?.code && (
              <span className="inline-block bg-[rgba(86,192,43,0.2)] rounded-[20px] px-3 py-1 text-[14px] font-medium text-text-subheading">
                {challenge.template.targetSDG.code.replace("SDG", "SDG ")}
              </span>
            )}
          </div>
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
          <HomeTab challenge={challenge} challengeId={challengeId} circleName={circle?.name} />
        ) : (
          <ActivitiesTab
            impactRecords={challenge.impactRecords ?? []}
            members={challenge.members ?? []}
          />
        )}

      </div>
    </div>

</>
  );
}
