"use client";

import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useAssignCircleLead, useJoinCircle } from "@/lib/hooks/circles";
import RecentActivitiesList from "@/components/ui/RecentActivitiesList";
import { canManageCircle, isWhitelisted } from "@/lib/permissions";
import { useUsers } from "@/lib/hooks/users";
import type {
  ApiCircle,
  ApiCircleChallenge,
  CircleMember,
} from "@/lib/types/circles";
import { calcChallengeProgress, deriveImpactLabel, formatImpactDisplayValue, isContributionOnlyImpact } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, MapPin, Pencil, UserPlus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "@/components/ui/Skeleton";
import Link from "next/link";
import { useState } from "react";
import CircleHero from "../components/CircleHero";
import JoinConversationButton from "@/components/ui/JoinConversationButton";
import RoleBadge from "@/components/ui/RoleBadge";
import { computeCircleRoles } from "@/lib/roles";

// ── Sub-components ─────────────────────────────────────────────────────────────

function CircleChallengeRow({
  item,
  rank,
}: {
  item: ApiCircleChallenge;
  rank: number;
}) {
  const t = useTranslations("circles");
  const locale = useLocale();
  const { percent: progress } = calcChallengeProgress(item);
  const since = new Date(item.createdAt).toLocaleDateString(locale, {
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
          <p className="text-xs text-text-secondary mt-0.5">{t("since", { date: since })}</p>
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
  const t = useTranslations("circles");
  const [showAll, setShowAll] = useState(false);
  const { data: users = [] } = useUsers();
  const visible = showAll ? members : members.slice(0, 5);

  const avatar = (member: CircleMember) =>
    member.avatarUrl ||
    users.find((u) => u.id === member.userId)?.user_metadata?.avatarUrl;

  const firstName = (member: CircleMember) => {
    const u = users.find((u) => u.id === member.userId);
    return u?.user_metadata?.firstName || u?.user_metadata?.lastName || member.userId;
  };

  return (
    <div className="py-7.5 border-b border-progress-track">
      <div className="flex items-center justify-between px-7.5 mb-6">
        <p className="text-xl font-bold text-text-subheading">{t("guardians")}</p>
        {members.length > 5 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-base text-gotf-blue"
          >
            {showAll ? t("showLess") : t("seeAll", { count: members.length })}
          </button>
        )}
      </div>

      <div className={`flex px-7.5 gap-2 ${showAll ? "flex-wrap gap-y-6" : ""}`}>
        {visible.map((member) => (
          <div key={member.userId} className="flex flex-col items-center gap-2 w-16">
            <Avatar src={avatar(member)} className="size-16 rounded-full border-2 border-white" />
            <Text variant="caption" className="text-text-subheading text-center leading-tight">
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
  const t = useTranslations("circles");
  const locale = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [showLeadPicker, setShowLeadPicker] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const joinCircle = useJoinCircle();
  const assignLead = useAssignCircleLead();
  const queryClient = useQueryClient();
  const { data: users = [] } = useUsers();

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
      <div className="flex flex-col bg-white min-h-full">
        {/* Hero */}
        <div className="relative h-65 bg-[#e8e8e8] animate-pulse shrink-0">
          <button onClick={() => router.back()} className="absolute left-7.5 top-7.5 size-10 rounded-full bg-white flex items-center justify-center shadow-sm z-10">
            <ChevronLeft size={20} className="text-text-primary" />
          </button>
        </div>
        {/* Card */}
        <div className="-mt-5 bg-white rounded-t-[20px] relative z-10">
          {/* Identity */}
          <div className="px-10 pt-7.5 pb-6">
            <Skeleton className="h-7 w-52 mb-2" />
            <Skeleton className="h-4 w-32 mb-1.5" />
            <Skeleton className="h-4 w-44 mb-5" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
          {/* Guardians */}
          <div className="py-7.5 border-b border-progress-track px-7.5">
            <Skeleton className="h-5 w-24 mb-6" />
            <div className="flex gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="size-16 rounded-full" />
                  <Skeleton className="h-3 w-10" />
                </div>
              ))}
            </div>
          </div>
          {/* Stats */}
          <div className="flex border-b border-progress-track">
            <div className="flex-1 px-10 pt-6 pb-5 flex flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-10" />
            </div>
            <div className="flex-1 px-5 pt-6 pb-5 flex flex-col gap-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-10" />
            </div>
          </div>
          {/* Challenges */}
          <div className="px-7.5 py-7.5">
            <Skeleton className="h-5 w-28 mb-6" />
            <div className="flex flex-col gap-7.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3.75">
                  <Skeleton className="w-2.5 h-4 rounded-sm" />
                  <Skeleton className="size-15 rounded-lg" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-[3px] w-full rounded-full" />
                  </div>
                  <Skeleton className="size-6 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <Text variant="body">{t("notFound")}</Text>
      </div>
    );
  }

  const isMember = !!user && circle.members.some((m) => m.userId === user.id);
  const canEdit = isWhitelisted(user?.email) || canManageCircle(user?.email, user?.id, circle);

  const joinedDate = new Date(circle.createdAt).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col bg-white min-h-full fade-up">
      <CircleHero bannerUrl={circle.bannerUrl} />

      {/* White card */}
      <div className="-mt-5 bg-white rounded-t-[20px] relative z-10">
        {/* Identity */}
        <div className="px-10 pt-7.5">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-[28px] font-bold text-text-subheading leading-tight flex-1">
              {circle.name}
            </h1>
            {canEdit && (
              <Link href={`/circles/${circleId}/edit`} className="p-1 mt-1 shrink-0">
                <Pencil size={18} className="text-text-muted" />
              </Link>
            )}
          </div>
          <p className="text-base text-[#666] mt-1">{t("since", { date: joinedDate })}</p>

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
            const isPending = joinCircle.isPending;
            const isDisabled = isMember || isPending;
            return (
              <div className="mt-3 mb-6 flex items-center gap-3 flex-wrap">
                <button
                  disabled={isDisabled}
                  onClick={() => {
                    if (!user) {
                      sessionStorage.setItem("guardians_return_to", `/circles/${circleId}`);
                      router.push("/");
                      return;
                    }
                    joinCircle.mutate({ circleId, userId: user.id });
                  }}
                  className={`px-5 h-10 text-base font-semibold rounded-full text-white transition-all shadow-[0_2px_10px_rgba(0,0,0,0.15)] disabled:opacity-60 disabled:cursor-not-allowed ${
                    isMember
                      ? "bg-[#333] w-36"
                      : "bg-linear-to-r from-[#008000] to-[#129612]"
                  }`}
                >
                  {isMember
                    ? t("circleJoined")
                    : isPending
                      ? t("joining")
                      : t("joinCircle")}
                </button>
                {isMember && (
                  <RoleBadge roles={computeCircleRoles(user?.id, user?.email, circle)} />
                )}
              </div>
            );
          })()}
        </div>

        {/* Guardians */}
        <GuardianRow members={circle.members} />
        {circle.communicationChannels?.length ? (
          <div className="flex justify-center py-5">
            <JoinConversationButton
              channels={circle.communicationChannels}
              members={circle.members}
              userId={user?.id}
            />
          </div>
        ) : null}

        {/* Stats */}
        <div className="flex border-b border-progress-track">
          <div className="flex-1 flex flex-col gap-2 px-10 pt-6 pb-5">
            <Text variant="caption" className="text-text-muted">
              {t("guardians")}
            </Text>
            <p className="text-2xl font-semibold text-text-subheading">
              {circle.members.length}
            </p>
          </div>
          <div className="flex-1 flex flex-col gap-2 px-5 pt-6 pb-5">
            <Text variant="caption" className="text-text-muted">
              {t("activeChallengeStat")}
            </Text>
            <p className="text-2xl font-semibold text-text-subheading">
              {circle.challenges.length}
            </p>
          </div>
        </div>

        {/* Impact */}
        {(circle.impactRecords ?? []).length > 0 && (
          <div className="border-b border-progress-track">
            <p className="px-10 pt-7.5 pb-4 text-xl font-bold text-text-subheading">
              {t("circle")} {t("impact")}
            </p>
            <div className="grid grid-cols-2 border-t border-[#e6e6e6]">
              {(circle.impactRecords ?? []).map((record, i) => {
                const contributionOnly = isContributionOnlyImpact(record);
                return (
                  <div
                    key={record.impactRecordId}
                    className={`border-b border-[#e6e6e6] pt-6 pb-7.5 flex flex-col gap-1.5 ${i % 2 === 0 ? "px-10 border-r border-[#e6e6e6]" : "px-5"}`}
                  >
                    <p className="text-[12px] text-[#767676] leading-snug">
                      {contributionOnly
                        ? record.impactSummary.contribution.unitOfMeasure
                        : deriveImpactLabel(record.impactSummary.impact.shortSummary ?? record.impactSummary.impact.summary)}
                    </p>
                    <p className="text-2xl font-semibold text-[#333]">
                      {formatImpactDisplayValue(
                        contributionOnly
                          ? record.impactSummary.contribution.displayName
                          : record.impactSummary.impact.displayName
                      )}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {formatImpactDisplayValue(record.impactSummary.contribution.displayName)} {t("contributed")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="border-b border-progress-track">
          <p className="px-10 pt-7.5 pb-5 text-xl font-bold text-text-subheading">
            {t("recentActivities")}
          </p>
          <RecentActivitiesList thingId={circle.circleId} />
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
            {expanded ? t("showLess") : t("showMore")}
          </button>
        </div>

        {/* Circle Lead */}
        {(() => {
          const lead = circle.circleLead as { id?: string; userId?: string; avatarUrl?: string; name?: string; firstName?: string; lastName?: string } | null;
          const leadUser = lead ? users.find((u) => u.id === (lead.id ?? lead.userId)) : null;
          const leadName = leadUser
            ? [leadUser.user_metadata.firstName, leadUser.user_metadata.lastName].filter(Boolean).join(" ")
            : [lead?.firstName, lead?.lastName].filter(Boolean).join(" ") || lead?.name || "";
          const leadAvatar = lead?.avatarUrl || leadUser?.user_metadata?.avatarUrl;
          const filtered = users.filter((u) =>
            !leadSearch ||
            `${u.user_metadata.firstName ?? ""} ${u.user_metadata.lastName ?? ""} ${u.email ?? ""}`.toLowerCase().includes(leadSearch.toLowerCase())
          );

          return (
            <div className="border-t border-progress-track border-b border-progress-track">
              {lead ? (
                <div className="flex items-center gap-5 px-7.5 py-5">
                  <Avatar src={leadAvatar} alt={leadName} className="size-10 rounded-full border border-border shrink-0" />
                  <div>
                    <p className="text-xl font-semibold text-text-primary">{leadName || t("circleLead")}</p>
                    <p className="text-base font-medium text-text-secondary">{t("circleLead")}</p>
                  </div>
                </div>
              ) : isWhitelisted(user?.email) ? (
                <div className="px-7.5 py-5 relative">
                  {!showLeadPicker ? (
                    <button
                      onClick={() => setShowLeadPicker(true)}
                      className="flex items-center gap-2 px-4 h-10 bg-surface border border-border rounded-full text-sm font-medium text-text-primary"
                    >
                      <UserPlus size={14} />
                      {t("assignCircleLead")}
                    </button>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        placeholder={t("searchUsers")}
                        autoFocus
                        className="w-full h-[44px] border border-[#d9d9d9] rounded-[8px] px-4 text-base placeholder:text-[#bfbfbf] outline-none"
                      />
                      {filtered.length > 0 && (
                        <div className="absolute left-7.5 right-7.5 mt-1 bg-white border border-[#d9d9d9] rounded-[8px] shadow-lg z-50 max-h-[200px] overflow-y-auto">
                          {filtered.map((u) => (
                            <button
                              key={u.id}
                              disabled={assignLead.isPending}
                              onClick={() => {
                                assignLead.mutate({ circleId, userId: u.id });
                                setShowLeadPicker(false);
                                setLeadSearch("");
                              }}
                              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#f5f5f5] disabled:opacity-50"
                            >
                              <div className="size-8 rounded-full bg-[#d9d9d9] overflow-hidden shrink-0">
                                {u.user_metadata.avatarUrl && (
                                  <img src={u.user_metadata.avatarUrl} alt="" className="w-full h-full object-cover" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-text-primary">
                                  {u.user_metadata.firstName} {u.user_metadata.lastName}
                                </p>
                                <p className="text-xs text-text-muted">{u.email}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => { setShowLeadPicker(false); setLeadSearch(""); }}
                        className="mt-2 text-sm text-text-muted"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          );
        })()}

        {/* Challenges */}
        <div className="px-7.5 py-7.5 pb-10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xl font-bold text-text-subheading">{t("challenges")}</p>
          </div>

          {canManageCircle(user?.email, user?.id, circle) && (
            <Link
              href={`/challenges/create?circleId=${circle.circleId}`}
              className="flex items-center justify-center w-full h-14 bg-linear-to-r from-[#008000] to-[#129612] text-white text-lg font-medium rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.15)] mb-6"
            >
              {t("createChallenge")}
            </Link>
          )}

          {circle.challenges.length === 0 ? (
            <p className="text-sm text-text-muted">{t("noChallenges")}</p>
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
