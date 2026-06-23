"use client";

import SearchBar from "@/components/ui/SearchBar";
import SectionHeader from "@/components/ui/SectionHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { usePublicMetrics } from "@/lib/hooks/metrics";
import ChallengeCard from "../components/ChallengeCard";
import CircleListItem from "../components/CircleListItem";
import HomeHeader from "../components/HomeHeader";
import ImpactSection from "../components/ImpactSection";
import LocationPill from "../components/LocationPill";

export default function HomeScreen() {
  const { user, loginData } = useAuth();
  const router = useRouter();
  const t = useTranslations("home");

  const displayName =
    user?.user_metadata.firstName || user?.email?.split("@")[0] || "Guardian";

  const impactRecords = loginData?.impactRecords ?? [];
  const badgeStats = impactRecords.slice(0, 3).map((r) => ({
    label: r.impactSummary.contribution.unitOfMeasure,
    value: r.impactSummary.contribution.value,
  }));

  const avatarUrl =
    user?.user_metadata.avatarUrl ||
    loginData?.circles
      .flatMap((c) => c.members)
      .find((m) => m.userId === user?.id)?.avatarUrl ||
    loginData?.challenges
      .flatMap((c) => c.members ?? [])
      .find((m) => m.userId === user?.id)?.avatarUrl;

  const activityStats = [
    {
      label: t("challengesStat"),
      value: loginData?.challengesCount.displayValue ?? "0",
    },
    {
      label: t("circlesStat"),
      value: loginData?.circlesCount.displayValue ?? "0",
    },
    { label: "", value: "" },
  ];

  const { data: publicMetrics } = usePublicMetrics();

  const challenges = loginData?.challenges ?? [];
  const circles = loginData?.circles ?? [];

  return (
    <div className="flex flex-col min-h-full bg-white gap-4">
      <HomeHeader name={displayName} avatarUrl={avatarUrl} hasNotification />
      <SearchBar
        placeholder={t("searchPlaceholder")}
        onSubmit={(q) =>
          router.push(`/discover${q ? `?q=${encodeURIComponent(q)}` : ""}`)
        }
      />
      <LocationPill
        city={
          user?.user_metadata.location.city ||
          user?.user_metadata.location.formattedAddress ||
          user?.user_metadata.location.address ||
          ""
        }
        country={user?.user_metadata.location.country || ""}
        onClick={() => router.push("/profile")}
      />

      <ImpactSection
        badgeStats={badgeStats}
        activityStats={activityStats}
        impactMatrix={publicMetrics?.impactMatrix}
        thingsMatrix={publicMetrics?.thingsMatrix}
      />

      <section className="mb-6">
        <div className="px-5">
          <SectionHeader title={t("activeChallenges")} href="/discover" />
        </div>
        {challenges.length > 0 ? (
          <div className="flex gap-3 pl-5 overflow-x-auto no-scrollbar pb-1">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.challengeId} challenge={challenge} />
            ))}
            <div className="w-5 shrink-0" aria-hidden="true" />
          </div>
        ) : (
          <div className="mx-5 mt-2 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-8">
            <img
              src="/images/Guardians Logo-full.png"
              alt=""
              className="w-14 h-14 object-contain opacity-20"
            />
            <p className="text-sm text-text-muted text-center">
              You haven&apos;t joined any challenges yet.
            </p>
            <button
              onClick={() => router.push("/discover")}
              className="px-5 h-9 rounded-full bg-gotf-green text-white text-sm font-semibold"
            >
              Find a Challenge
            </button>
          </div>
        )}
      </section>

      <section className="bg-white rounded-t-[20px] shadow-[0_-5px_20px_0_rgba(0,0,0,0.05)] px-5 pt-6 pb-8 -mt-2">
        <SectionHeader title={t("activeCircles")} href="/discover" />
        {circles.length > 0 ? (
          <div className="flex flex-col gap-7.5">
            {circles.map((circle, i) => (
              <CircleListItem key={circle.circleId} circle={circle} rank={i + 1} />
            ))}
          </div>
        ) : (
          <div className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-8">
            <img
              src="/images/Guardians Logo-logo.png"
              alt=""
              className="w-10 h-10 object-contain opacity-20"
            />
            <p className="text-sm text-text-muted text-center">
              You&apos;re not part of any circles yet.
            </p>
            <button
              onClick={() => router.push("/discover")}
              className="px-5 h-9 rounded-full bg-gotf-green text-white text-sm font-semibold"
            >
              Join a Circle
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
