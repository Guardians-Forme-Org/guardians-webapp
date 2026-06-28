"use client";

import Avatar from "@/components/ui/Avatar";
import JoinConversationButton from "@/components/ui/JoinConversationButton";
import RecentActivitiesList from "@/components/ui/RecentActivitiesList";
import Skeleton from "@/components/ui/Skeleton";
import RoleBadge from "@/components/ui/RoleBadge";
import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { useChallenge, useJoinChallenge } from "@/lib/hooks/challenges";
import { useJoinCircle } from "@/lib/hooks/circles";
import { useUsers } from "@/lib/hooks/users";
import { canManageCircle, isWhitelisted } from "@/lib/permissions";
import { computeChallengeRoles } from "@/lib/roles";
import type { ApiCircle, ApiCircleChallenge } from "@/lib/types/circles";
import {
  calcChallengeProgress,
  deriveImpactLabel,
  formatImpactDisplayValue,
} from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, ChevronLeft, ChevronRight, MapPin, Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import ChallengeHero from "../components/ChallengeHero";

function HomeTab({
  challenge,
  challengeId,
  circleName,
  userId,
}: {
  challenge: ApiCircleChallenge;
  challengeId: string;
  circleName?: string;
  userId?: string | null;
}) {
  const t = useTranslations("challenges");
  const [expanded, setExpanded] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const { data: users = [] } = useUsers();
  const { percent: progress } = calcChallengeProgress(challenge);
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
          {expanded ? t("showLess") : t("showMore")}
        </button>
      </div>

      <div className="border-t border-progress-track" />

      {/* Progress */}
      <div className="px-10 py-7.5 flex flex-col gap-4">
        <Text variant="subheading" className="font-semibold text-[20px]">
          {t("progress")}
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
      {!!challenge.facilitator &&
        (() => {
          const f = challenge.facilitator as {
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
          return (
            <>
              <div className="flex items-center gap-5 px-7.5 py-5">
                <Avatar
                  src={fAvatar}
                  alt={fName}
                  className="size-10 rounded-full border border-border shrink-0"
                />
                <div>
                  <p className="text-xl font-semibold text-text-primary">
                    {fName}
                  </p>
                  <p className="text-base font-medium text-text-secondary">
                    {t("facilitator")}
                  </p>
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
                <span className="font-normal">{t("by")} </span>
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
                  {showAllMembers
                    ? t("showLess")
                    : t("seeAll", { count: members.length })}
                </button>
              )}
            </div>

            <div
              className={`flex px-7.5 mb-6 gap-2 ${showAllMembers ? "flex-wrap gap-y-6" : ""}`}
            >
              {(showAllMembers ? members : members.slice(0, 5)).map(
                (member) => {
                  const memberUser = users.find((u) => u.id === member.userId);
                  const name = memberUser
                    ? `${memberUser.user_metadata.firstName ?? ""}`.trim() ||
                      member.userId
                    : member.userId;
                  const av =
                    member.avatarUrl || memberUser?.user_metadata?.avatarUrl;
                  return (
                    <div
                      key={member.userId}
                      className="flex flex-col items-center gap-2 w-16"
                    >
                      <Avatar
                        src={av}
                        alt={name}
                        className="size-16 rounded-full border-2 border-white"
                      />
                      <Text
                        variant="caption"
                        className="text-text-subheading text-center leading-tight"
                      >
                        {name.split(" ")[0]}
                      </Text>
                    </div>
                  );
                },
              )}
            </div>

            <div className="flex justify-center">
              <JoinConversationButton
                channels={challenge.communicationChannels}
                members={challenge.members}
                userId={userId}
              />
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
                className={`border-b border-[#e6e6e6] pt-6 pb-7.5 flex flex-col gap-1.5 ${i % 2 === 0 ? "px-10 border-r border-[#e6e6e6]" : "px-5"}`}
              >
                <p className="text-[12px] text-[#767676] leading-snug">
                  {deriveImpactLabel(
                    record.impactSummary.impact.shortSummary ??
                      record.impactSummary.impact.summary,
                  )}
                </p>
                <p className="text-2xl font-semibold text-[#333]">
                  {formatImpactDisplayValue(
                    record.impactSummary.impact.displayName,
                  )}
                </p>
                <p className="text-[11px] text-text-muted">
                  {formatImpactDisplayValue(
                    record.impactSummary.contribution.displayName,
                  )}{" "}
                  {t("contributed")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps */}
      {(challenge.challengeSteps ?? []).length > 0 && (
        <div className="border-t border-progress-track py-7.5">
          <p className="px-10 text-xl font-semibold text-text-subheading mb-5">
            {t("steps")}
          </p>
          <div className="flex flex-col gap-3 px-6">
            {(challenge.challengeSteps ?? []).map((step) => (
              <Link
                key={step.stepId}
                href={`/challenges/${challengeId}/steps/${step.stepId}`}
                className={`flex items-center gap-4 border rounded-[10px] px-4 py-2.5 ${
                  step.isCompleted
                    ? "border-gotf-green bg-[#f0faf0]"
                    : "border-[#eee]"
                }`}
              >
                {step.isCompleted ? (
                  <CheckCircle
                    size={18}
                    className="text-gotf-green shrink-0 z-10"
                  />
                ) : (
                  <p className="text-base font-medium text-black w-3 shrink-0 text-center">
                    {step.stepNumber}
                  </p>
                )}
                <Avatar className="size-8 rounded-[8px] -ml-1 shrink-0" />
                <div className="flex-1 min-w-0 px-1">
                  <p className="text-base font-semibold text-[#1a1a1a] truncate">
                    {step.title}
                  </p>
                  <p className="text-[12px] text-[#1a1a1a] truncate">
                    {step.description}
                  </p>
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

function ActivitiesTab({ challengeId }: { challengeId: string }) {
  return (
    <div className="pt-7.5">
      <RecentActivitiesList thingId={challengeId} />
    </div>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

type Props = { challengeId: string };

export default function ChallengeScreen({ challengeId }: Props) {
  const t = useTranslations("challenges");
  const locale = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"home" | "activities">("home");
  const joinChallenge = useJoinChallenge();
  const joinCircle = useJoinCircle();
  const { data: users = [] } = useUsers();
  const { data: challenge, isLoading, error } = useChallenge(challengeId);
  const { data: circle } = useQuery({
    queryKey: ["circle", challenge?.circleId],
    queryFn: () => api.get<ApiCircle>(`/circles/${challenge!.circleId}`),
    enabled: !!challenge?.circleId,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col bg-white min-h-full">
        {/* Hero */}
        <div className="relative h-60 bg-[#e8e8e8] animate-pulse shrink-0">
          <button onClick={() => router.back()} className="absolute left-7.5 top-7.5 size-10 rounded-full bg-white flex items-center justify-center shadow-sm z-10">
            <ChevronLeft size={20} className="text-text-primary" />
          </button>
        </div>
        {/* Card */}
        <div className="-mt-5 bg-white rounded-t-[20px] relative z-10">
          {/* Identity */}
          <div className="px-10 pt-7.5 pb-0">
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-7 w-28 rounded-[20px]" />
              <Skeleton className="h-7 w-20 rounded-[20px]" />
            </div>
            <Skeleton className="h-7 w-3/4 mb-2" />
            <Skeleton className="h-4 w-36 mb-4" />
            <Skeleton className="h-10 w-40 rounded-full mb-1" />
          </div>
          {/* Tab bar */}
          <div className="flex px-10 mt-5 gap-6">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="border-t border-progress-track mt-2.5" />
          {/* Description */}
          <div className="px-10 py-5 flex flex-col gap-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="border-t border-progress-track" />
          {/* Progress */}
          <div className="px-10 py-7.5 flex flex-col gap-4">
            <Skeleton className="h-5 w-24" />
            <div className="flex items-center gap-5">
              <Skeleton className="flex-1 h-2.5 rounded-full" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
          <div className="border-t border-progress-track" />
          {/* Members */}
          <div className="py-7.5 px-7.5">
            <Skeleton className="h-5 w-32 mb-5" />
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="size-16 rounded-full" />
                  <Skeleton className="h-3 w-10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">{t("notFound")}</Text>
      </div>
    );
  }

  const isMember =
    !!user && (challenge.members ?? []).some((m) => m.userId === user.id);

  const facilitator = challenge.facilitator as {
    id?: string;
    userId?: string;
  } | null;
  const isFacilitator =
    !!user &&
    !!(
      (facilitator?.id && facilitator.id === user.id) ||
      (facilitator?.userId && facilitator.userId === user.id)
    );
  const canEdit =
    isWhitelisted(user?.email) ||
    isFacilitator ||
    canManageCircle(
      user?.email,
      user?.id,
      circle ?? { createdBy: challenge.createdBy },
    );

  const since = new Date(challenge.createdAt).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <div className="flex flex-col bg-white min-h-full fade-up">
        <ChallengeHero bannerUrl={challenge.bannerUrl} />

        <div className="-mt-5 bg-white rounded-t-[20px] relative z-10">
          {/* Identity */}
          <div className="px-10 pt-7.5 pb-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-block bg-[#d9d9d9] rounded-[20px] px-3 py-1 text-[14px] text-text-subheading">
                {circle?.name ?? challenge.circleId}
              </span>
              {(challenge.template?.SDGAlignments?.length
                ? challenge.template.SDGAlignments
                : challenge.template?.targetSDG
                  ? [{ code: challenge.template.targetSDG.code, name: challenge.template.targetSDG.name ?? challenge.template.targetSDG.title ?? "" }]
                  : []
              ).map((sdg) => (
                <span key={sdg.code} className="inline-block bg-[rgba(86,192,43,0.2)] rounded-[20px] px-3 py-1 text-[14px] font-medium text-text-subheading">
                  {sdg.code.replace("SDG", "SDG ")}
                </span>
              ))}
              {(challenge.template?.impactDomains ?? []).map((domain) => (
                <span key={domain.code} className="inline-block bg-[rgba(0,0,0,0.06)] rounded-[20px] px-3 py-1 text-[14px] font-medium text-text-subheading">
                  {domain.name}
                </span>
              ))}
            </div>
            <div className="flex items-start justify-between mt-3 gap-2">
              <h1 className="text-[28px] font-bold text-text-subheading leading-tight flex-1">
                {challenge.name}
              </h1>
              {canEdit && (
                <Link
                  href={`/challenges/${challengeId}/edit`}
                  className="p-1 mt-1 shrink-0"
                >
                  <Pencil size={18} className="text-text-muted" />
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <p className="text-base text-[#666]">
                {t("since", { date: since })}
              </p>
              <RoleBadge
                roles={computeChallengeRoles(user?.id, user?.email, challenge)}
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              {(() => {
                const isPending = joinChallenge.isPending;
                const isDisabled = isMember || isPending;
                return (
                  <button
                    disabled={isDisabled}
                    onClick={() => {
                      if (!user) {
                        sessionStorage.setItem(
                          "guardians_return_to",
                          `/challenges/${challengeId}`,
                        );
                        router.push("/");
                        return;
                      }
                      joinChallenge.mutate(
                        { challengeId, userId: user.id },
                        {
                          onSuccess: () => {
                            const alreadyInCircle = (circle?.members ?? []).some(
                              (m) => m.userId === user.id,
                            );
                            if (!alreadyInCircle && challenge.circleId) {
                              joinCircle.mutate({
                                circleId: challenge.circleId,
                                userId: user.id,
                              });
                            }
                          },
                        },
                      );
                    }}
                    className={`px-5 h-10 text-white text-base font-semibold rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)] transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      isMember
                        ? "bg-[#333] w-40"
                        : "bg-linear-to-r from-[#008000] to-[#129612]"
                    }`}
                  >
                    {isMember
                      ? t("joined")
                      : isPending
                        ? t("joining")
                        : t("joinChallenge")}
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex px-10 mt-5">
            {(["home", "activities"] as const).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`px-5 h-10 flex items-center text-base capitalize transition-colors ${
                  tab === tabKey
                    ? "border-b-2 border-[#303030] text-[#303030] font-medium"
                    : "text-text-muted"
                }`}
              >
                {tabKey === "home" ? t("tabHome") : t("tabActivities")}
              </button>
            ))}
          </div>
          <div className="border-t border-progress-track" />

          {tab === "home" ? (
            <HomeTab
              challenge={challenge}
              challengeId={challengeId}
              circleName={circle?.name}
              userId={user?.id}
            />
          ) : (
            <ActivitiesTab challengeId={challenge.challengeId} />
          )}
        </div>
      </div>
    </>
  );
}
