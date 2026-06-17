"use client";

import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useJoinCircle } from "@/lib/hooks/circles";
import { useUsers } from "@/lib/hooks/users";
import type {
  ApiCircle,
  ApiCircleChallenge,
  CircleMember,
} from "@/lib/types/circles";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import CircleHero from "../components/CircleHero";

// ── Sub-components ─────────────────────────────────────────────────────────────

function CircleChallengeRow({
  item,
  rank,
}: {
  item: ApiCircleChallenge;
  rank: number;
}) {
  const progress =
    item.steps > 0 ? Math.round((item.currentStep / item.steps) * 100) : 0;
  const since = new Date(item.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  return (
    <Link href={`/challenges/${item.challengeId}`}>
      <div className="flex items-center gap-3.75">
        <span className="w-2.5 text-center font-medium text-base text-black shrink-0">
          {rank}
        </span>
        <div className="size-15 rounded-lg overflow-hidden shrink-0 bg-surface">
          {item.bannerUrl ? (
            <img
              src={item.bannerUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : null}
        </div>
        <div className="flex-1 min-w-0 px-1">
          <p className="text-base font-semibold text-text-primary leading-tight">
            {item.name}
          </p>
          <p className="text-xs text-text-secondary mt-0.5">Since {since}</p>
          <div className="mt-1.5 h-[3px] bg-[#787878] rounded-full overflow-hidden">
            <div
              className="h-full bg-gotf-yellow rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <ChevronRight size={24} className="text-text-muted shrink-0" />
      </div>
    </Link>
  );
}

function GuardianRow({ members }: { members: CircleMember[] }) {
  const [showAll, setShowAll] = useState(false);
  const { data: users = [] } = useUsers();
  const visible = showAll ? members : members.slice(0, 5);

  const avatar = (member: CircleMember) =>
    member.avatarUrl ||
    users.find((u) => u.id === member.userId)?.user_metadata?.avatarUrl;

  const firstName = (member: CircleMember) => {
    const u = users.find((u) => u.id === member.userId);
    return (
      u?.user_metadata?.firstName || u?.user_metadata?.lastName || member.userId
    );
  };

  return (
    <div className="py-7.5 border-b border-progress-track">
      <div className="flex items-center justify-between px-7.5 mb-6">
        <p className="text-xl font-bold text-text-subheading">Guardians</p>
        {members.length > 5 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-base text-gotf-blue"
          >
            {showAll ? "Show less" : `See all (${members.length})`}
          </button>
        )}
      </div>

      <div
        className={`flex px-7.5 gap-2 ${showAll ? "flex-wrap gap-y-6" : ""}`}
      >
        {visible.map((member) => (
          <div
            key={member.userId}
            className="flex flex-col items-center gap-2 w-16"
          >
            <div className="size-16 rounded-full bg-[#d9d9d9] border-2 border-white overflow-hidden">
              {avatar(member) && (
                <img
                  src={avatar(member)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <Text
              variant="caption"
              className="text-text-subheading text-center leading-tight"
            >
              {firstName(member)}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

type Props = { circleId: string };

export default function CircleScreen({ circleId }: Props) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const joinCircle = useJoinCircle();

  const {
    data: circle,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["circle", circleId],
    queryFn: () => api.get<ApiCircle>(`/circles/${circleId}`),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">Loading…</Text>
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">Circle not found.</Text>
      </div>
    );
  }

  const joinedDate = new Date(circle.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col bg-white min-h-full">
      <CircleHero bannerUrl={circle.bannerUrl} />

      {/* White card */}
      <div className="-mt-5 bg-white rounded-t-[20px] relative z-10">
        {/* Identity */}
        <div className="px-10 pt-7.5">
          <h1 className="text-[28px] font-bold text-text-subheading leading-tight">
            {circle.name}
          </h1>
          <p className="text-base text-[#666] mt-1">Since {joinedDate}</p>

          {(circle.region.formattedAddress || circle.region.city) && (
            <div className="flex items-center gap-1.5 mt-2">
              <MapPin size={16} className="text-gotf-green shrink-0" />
              <p className="text-base text-text-primary">
                {circle.region.formattedAddress ||
                  [circle.region.city, circle.region.province]
                    .filter(Boolean)
                    .join(", ")}
              </p>
            </div>
          )}

          {(() => {
            const isMember =
              !!user && circle.members.some((m) => m.userId === user.id);
            const isPending = joinCircle.isPending;
            const isDisabled = isMember || isPending;
            return (
              <div className="mt-3 mb-6">
                <button
                  disabled={isDisabled}
                  onClick={() => {
                    if (!user) return;
                    joinCircle.mutate({ circleId, userId: user.id });
                  }}
                  className={`px-5 h-10 text-base font-semibold rounded-full text-white transition-all shadow-[0_2px_10px_rgba(0,0,0,0.15)] disabled:opacity-60 disabled:cursor-not-allowed ${
                    isMember
                      ? "bg-[#333] w-36"
                      : "bg-linear-to-r from-[#008000] to-[#129612]"
                  }`}
                >
                  {isMember
                    ? "Circle joined"
                    : isPending
                      ? "Joining…"
                      : "Join Circle"}
                </button>
              </div>
            );
          })()}
        </div>

        {/* Guardians */}
        <GuardianRow members={circle.members} />

        {/* Stats */}
        <div className="flex border-b border-progress-track">
          <div className="flex-1 flex flex-col gap-2 px-10 pt-6 pb-5">
            <Text variant="caption" className="text-text-muted">
              Guardians
            </Text>
            <p className="text-2xl font-semibold text-text-subheading">
              {circle.members.length}
            </p>
          </div>
          <div className="flex-1 flex flex-col gap-2 px-5 pt-6 pb-5">
            <Text variant="caption" className="text-text-muted">
              Active Challenges
            </Text>
            <p className="text-2xl font-semibold text-text-subheading">
              {circle.challenges.length}
            </p>
          </div>
        </div>

        {/* Impact */}
        <div className="border-b border-progress-track">
          <p className="px-10 pt-7.5 pb-5 text-xl font-bold text-text-subheading">
            Impact
          </p>
          {!circle.impactRecords?.length ? (
            <p className="px-10 pb-7.5 text-sm text-text-muted">
              No impact recorded yet.
            </p>
          ) : (
            circle.impactRecords.map((record, i) => (
              <div
                key={record.impactRecordId ?? i}
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

        {/* Description */}
        <div className="px-10 py-7.5 border-b border-progress-track">
          <p
            className={`text-base text-text-primary leading-relaxed ${!expanded ? "line-clamp-4" : ""}`}
          >
            {circle.description}
          </p>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-base text-gotf-blue mt-2"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        </div>

        {/* Circle lead */}
        {!!circle.circleLead && (
          <div className="flex items-center gap-5 px-7.5 py-7.5 border-b border-progress-track">
            <div className="size-10 rounded-full bg-surface border border-border shrink-0" />
            <div>
              <p className="text-xl font-semibold text-text-primary">
                Circle Lead
              </p>
            </div>
          </div>
        )}

        {/* Challenges */}
        <div className="px-7.5 py-7.5 pb-10">
          <div className="flex items-center justify-between mb-7.5">
            <p className="text-xl font-bold text-text-subheading">Challenges</p>
            <Link
              href={`/challenges/create?circleId=${circle.circleId}`}
              className="text-base font-medium text-gotf-green"
            >
              + Start Challenge
            </Link>
          </div>

          {circle.challenges.length === 0 ? (
            <p className="text-sm text-text-muted">No challenges yet.</p>
          ) : (
            <div className="flex flex-col gap-7.5">
              {circle.challenges.map((challenge, i) => (
                <CircleChallengeRow
                  key={challenge.challengeId}
                  item={challenge}
                  rank={i + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
