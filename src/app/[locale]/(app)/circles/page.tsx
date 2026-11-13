"use client";

import { MapPin, Plus, ChevronRight, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import SectionHeader from "@/components/ui/SectionHeader";
import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { isWhitelisted } from "@/lib/permissions";
import type { ApiCircle, CirclesListResponse } from "@/lib/types/circles";
import { useTranslations } from "next-intl";

// ── Circle card ───────────────────────────────────────────────────────────────

// A circle membership's role (circleMembers.role) as a translated label
function useRoleLabel() {
  const t = useTranslations("circles");
  const tCommon = useTranslations("common");
  return (role: string) => {
    switch (role.toUpperCase()) {
      case "MEMBER": return t("roleMember");
      case "CREATOR": return t("roleCreator");
      case "CIRCLE_LEAD": return tCommon("roleCircleLead");
      case "ADMIN": return tCommon("roleAdmin");
      default: return role.toLowerCase().replace(/_/g, " ");
    }
  };
}

function CircleCard({ circle, role }: { circle: ApiCircle; role?: string }) {
  const t = useTranslations("circles");
  const roleLabel = useRoleLabel();
  const location = circle.region.formattedAddress || [circle.region.city, circle.region.province].filter(Boolean).join(", ") || "—";

  return (
    <Link
      href={`/circles/${circle.circleId}`}
      className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-border"
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gotf-green">
        {circle.bannerUrl ? (
          <img src={circle.bannerUrl} alt={circle.name} className="w-full h-full object-cover rounded-xl" />
        ) : (
          <Users size={20} className="text-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Text variant="subheading" className="font-semibold truncate">
            {circle.name}
          </Text>
          {role && (
            <span className="shrink-0 text-[10px] font-medium text-gotf-green bg-green-50 px-2 py-0.5 rounded-full capitalize">
              {roleLabel(role)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-text-muted mt-0.5">
          <MapPin size={10} />
          <Text variant="label" className="truncate normal-case tracking-normal">
            {location}
          </Text>
        </div>
        <Text variant="label" className="normal-case tracking-normal mt-0.5">
          {(() => { const n = circle.membersCount?.total ?? circle.members.length; return `${n} ${n === 1 ? t("guardian") : t("guardians")}`; })()} · {(() => { const c = circle.challenges.length; return `${c} ${c === 1 ? t("challenge") : t("challenges")}`; })()}
        </Text>
      </div>

      {role ? (
        <ChevronRight size={16} className="text-text-muted shrink-0" />
      ) : (
        <button className="shrink-0 text-[11px] font-semibold text-gotf-green border border-gotf-green px-2.5 py-1 rounded-lg">
          {t("join")}
        </button>
      )}
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CirclesPage() {
  const t = useTranslations("circles");
  const { user } = useAuth();
  const { data: circles, isLoading, error } = useQuery({
    queryKey: ["circles"],
    queryFn: () => api.get<CirclesListResponse>("/circles"),
  });

  const myCircles = circles?.filter((c) =>
    c.members.some((m) => m.userId === user?.id)
  ) ?? [];

  const exploreCircles = circles?.filter((c) =>
    !c.members.some((m) => m.userId === user?.id)
  ) ?? [];

  return (
    <div className="flex flex-col min-h-full bg-surface">
      <header className="bg-white border-b border-border">
        <PageHeader
          title={t("listTitle")}
          action={
            isWhitelisted(user?.email) ? (
              <Link
                href="/circles/create"
                className="flex items-center gap-1.5 bg-gotf-green text-white text-xs font-medium px-3 py-2 rounded-xl"
              >
                <Plus size={13} />
                {t("listCreate")}
              </Link>
            ) : null
          }
        />
        <SearchBar placeholder={t("searchCircles")} />
      </header>

      <div className="flex-1 px-5 py-5 space-y-6">
        {isLoading && (
          <p className="text-sm text-text-muted text-center pt-10">{t("loadingCircles")}</p>
        )}

        {error && (
          <p className="text-sm text-red-500 text-center pt-10">
            {error instanceof Error ? error.message : t("loadCirclesFailed")}
          </p>
        )}

        {!isLoading && !error && (
          <>
            <section>
              <SectionHeader title={t("myCircles")} />
              {myCircles.length === 0 ? (
                <p className="text-sm text-text-muted">{t("noCirclesJoined")}</p>
              ) : (
                <div className="space-y-2.5">
                  {myCircles.map((c) => {
                    const membership = c.members.find((m) => m.userId === user?.id);
                    return (
                      <CircleCard key={c.id} circle={c} role={membership?.role} />
                    );
                  })}
                </div>
              )}
            </section>

            {exploreCircles.length > 0 && (
              <section>
                <SectionHeader title={t("exploreNearYou")} />
                <div className="space-y-2.5">
                  {exploreCircles.map((c) => (
                    <CircleCard key={c.id} circle={c} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
