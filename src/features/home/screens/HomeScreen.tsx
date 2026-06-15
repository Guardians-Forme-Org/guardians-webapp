"use client";

import SearchBar from "@/components/ui/SearchBar";
import SectionHeader from "@/components/ui/SectionHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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
      />

      <ImpactSection badgeStats={badgeStats} activityStats={activityStats} />

      {challenges.length > 0 && (
        <section className="mb-6">
          <div className="px-5">
            <SectionHeader title={t("activeChallenges")} href="/discover" />
          </div>
          <div className="flex gap-3 pl-5 overflow-x-auto no-scrollbar pb-1">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.challengeId}
                challenge={challenge}
              />
            ))}
            <div className="w-5 shrink-0" aria-hidden="true" />
          </div>
        </section>
      )}

      {circles.length > 0 && (
        <section className="bg-white rounded-t-[20px] shadow-[0_-5px_20px_0_rgba(0,0,0,0.05)] px-5 pt-6 pb-8 -mt-2">
          <SectionHeader title={t("activeCircles")} href="/discover" />
          <div className="flex flex-col gap-7.5">
            {circles.map((circle, i) => (
              <CircleListItem
                key={circle.circleId}
                circle={circle}
                rank={i + 1}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
