"use client";

import SearchBar from "@/components/ui/SearchBar";
import RecentActivitiesList from "@/components/ui/RecentActivitiesList";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { usePublicMetrics } from "@/lib/hooks/metrics";
import { useEffect } from "react";
import CirclesMap from "../components/CirclesMap";
import HomeHeader from "../components/HomeHeader";
import ImpactSection from "../components/ImpactSection";

// The mine/global toggle is retired: personal circles, challenges and
// activities live on the profile screen now — home is always global
const MAP_REFETCH_FLAG = "gotf_refetch_home";

export default function HomeScreen() {
  const { user, loginData } = useAuth();
  const router = useRouter();
  const t = useTranslations("home");

  // Reload when returning from a circle opened via the map
  useEffect(() => {
    if (sessionStorage.getItem(MAP_REFETCH_FLAG) !== "1") return;
    sessionStorage.removeItem(MAP_REFETCH_FLAG);
    window.location.reload();
   
  }, []);

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
    label: r.contribution?.unitOfMeasure ?? "",
    value: r.contribution?.value ?? 0,
  }));
  const activityStats = [
    { label: t("challengesStat"), value: loginData?.challengesCount.displayValue ?? "0" },
    { label: t("circlesStat"), value: loginData?.circlesCount.displayValue ?? "0" },
    { label: "", value: "" },
  ];

  return (
    <div className="flex flex-col min-h-full bg-white gap-4">
      <HomeHeader name={displayName} avatarUrl={avatarUrl} hasNotification />
      <SearchBar
        placeholder={t("searchPlaceholder")}
        onSubmit={(q) =>
          router.push(`/discover${q ? `?q=${encodeURIComponent(q)}` : ""}`)
        }
      />

      {/* ── Global view ─────────────────────────────────── */}
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
    </div>
  );
}
