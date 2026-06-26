"use client";

import SearchBar from "@/components/ui/SearchBar";
import SectionHeader from "@/components/ui/SectionHeader";
import RecentActivitiesList from "@/components/ui/RecentActivitiesList";
import Skeleton from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { usePublicMetrics } from "@/lib/hooks/metrics";
import { useState } from "react";
import ChallengeCard from "../components/ChallengeCard";
import CircleListItem from "../components/CircleListItem";
import CirclesMap from "../components/CirclesMap";
import HomeHeader from "../components/HomeHeader";
import ImpactSection from "../components/ImpactSection";

function ModeSwitcher({
  mode,
  onSwitch,
}: {
  mode: "global" | "mine";
  onSwitch: (m: "global" | "mine") => void;
}) {
  const t = useTranslations("home");
  return (
    <div className="flex justify-center px-5 mb-2">
      <div className="flex bg-[#f0f0f0] rounded-full p-0.5">
        <button
          onClick={() => onSwitch("global")}
          className={`px-5 h-8 rounded-full text-sm font-medium transition-all ${
            mode === "global"
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-muted"
          }`}
        >
          {t("global")}
        </button>
        <button
          onClick={() => onSwitch("mine")}
          className={`px-5 h-8 rounded-full text-sm font-medium transition-all ${
            mode === "mine"
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-muted"
          }`}
        >
          {t("mine")}
        </button>
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const { user, loginData, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("home");
  const isGuest = !user;
  const [mode, setMode] = useState<"global" | "mine">("global");
  const effectiveMode = isGuest ? "global" : mode;

  const displayName =
    user?.user_metadata.firstName || user?.email?.split("@")[0] || "Guardian";

  const avatarUrl =
    user?.user_metadata.avatarUrl ||
    loginData?.circles
      .flatMap((c) => c.members)
      .find((m) => m.userId === user?.id)?.avatarUrl ||
    loginData?.challenges
      .flatMap((c) => c.members ?? [])
      .find((m) => m.userId === user?.id)?.avatarUrl;

  const { data: publicMetrics, isLoading: metricsLoading } = usePublicMetrics();

  const impactRecords = loginData?.impactRecords ?? [];
  const badgeStats = impactRecords.slice(0, 3).map((r) => ({
    label: r.impactSummary.contribution.unitOfMeasure,
    value: r.impactSummary.contribution.value,
  }));
  const activityStats = [
    { label: t("challengesStat"), value: loginData?.challengesCount.displayValue ?? "0" },
    { label: t("circlesStat"), value: loginData?.circlesCount.displayValue ?? "0" },
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

      {loading
        ? <div className="flex justify-center px-5 mb-2"><Skeleton className="h-9 w-44 rounded-full" /></div>
        : !isGuest && <ModeSwitcher mode={mode} onSwitch={setMode} />
      }

      {effectiveMode === "global" ? (
        /* ── Global view ─────────────────────────────────── */
        <div className="flex flex-col gap-6 pb-10">
          <div className="fade-up" style={{ animationDelay: "0ms" }}>
            <ImpactSection
              badgeStats={badgeStats}
              activityStats={activityStats}
              impactMatrix={publicMetrics?.impactMatrix}
              thingsMatrix={publicMetrics?.thingsMatrix}
              mode="global"
              isLoading={metricsLoading}
            />
          </div>

          {/* Located */}
          <div className="flex flex-col gap-3 fade-up" style={{ animationDelay: "80ms" }}>
            <p className="px-5 text-xl font-bold text-text-subheading">{t("located")}</p>
            <CirclesMap />
          </div>

          {/* Recent Activities */}
          <div className="flex flex-col gap-3 fade-up" style={{ animationDelay: "160ms" }}>
            <p className="px-5 text-xl font-bold text-text-subheading">{t("recentActivities")}</p>
            {user?.id && <RecentActivitiesList userId={user.id} />}
          </div>
        </div>
      ) : effectiveMode === "mine" ? (
        /* ── Mine view ───────────────────────────────────── */
        <div className="flex flex-col gap-4 pb-10">
          <div className="fade-up" style={{ animationDelay: "0ms" }}>
            <ImpactSection
              badgeStats={badgeStats}
              activityStats={activityStats}
              impactMatrix={publicMetrics?.impactMatrix}
              thingsMatrix={publicMetrics?.thingsMatrix}
              mode="my"
              isLoading={metricsLoading}
            />
          </div>

          {/* Active Challenges */}
          <section className="fade-up" style={{ animationDelay: "80ms" }}>
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
                  {t("noActiveChallenges")}
                </p>
                <button
                  onClick={() => router.push("/discover")}
                  className="px-5 h-9 rounded-full bg-gotf-green text-white text-sm font-semibold"
                >
                  {t("findChallenge")}
                </button>
              </div>
            )}
          </section>

          {/* Active Circles */}
          <section className="bg-white rounded-t-[20px] shadow-[0_-5px_20px_0_rgba(0,0,0,0.05)] px-5 pt-6 pb-4 -mt-2 fade-up" style={{ animationDelay: "160ms" }}>
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
                  {t("noActiveCircles")}
                </p>
                <button
                  onClick={() => router.push("/discover")}
                  className="px-5 h-9 rounded-full bg-gotf-green text-white text-sm font-semibold"
                >
                  {t("joinCircle")}
                </button>
              </div>
            )}
          </section>

          {/* Recent Activities */}
          <div className="flex flex-col gap-3 px-0 fade-up" style={{ animationDelay: "240ms" }}>
            <p className="px-5 text-xl font-bold text-text-subheading">{t("recentActivities")}</p>
            {user?.id && <RecentActivitiesList userId={user.id} />}
          </div>
        </div>
      ) : null}
    </div>
  );
}
