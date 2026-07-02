"use client";

import RoleBadge from "@/components/ui/RoleBadge";
import Avatar from "@/components/ui/Avatar";
import Skeleton from "@/components/ui/Skeleton";
import { computeGlobalRoles } from "@/lib/roles";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import LocationSheet from "@/components/ui/LocationSheet";
import RecentActivitiesList from "@/components/ui/RecentActivitiesList";
import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useRouter } from "@/i18n/navigation";
import { PROFILE_CONFIG } from "@/lib/config";
import type { ApiCircle, ApiImpactRecord } from "@/lib/types/circles";
import type { ContributionMarker } from "@/lib/types/auth";
import { isContributionOnlyImpact } from "@/lib/utils";
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Compass,
  Eye,
  Globe,
  Leaf,
  Lightbulb,
  LogOut,
  MapPin,
  ScrollText,
  Play,
  Pencil,
  Shuffle,
  User,
  X,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

function aggregateUserCircleImpact(circles: ApiCircle[], locale: string): ApiImpactRecord[] {
  const allRecords = circles.flatMap((c) => c.impactRecords ?? []);

  const grouped = new Map<string, ApiImpactRecord[]>();
  for (const r of allRecords) {
    const bucket = grouped.get(r.siUnit) ?? [];
    bucket.push(r);
    grouped.set(r.siUnit, bucket);
  }

  return Array.from(grouped.values()).map((bucket) => {
    const first = bucket[0];
    const totalContrib = bucket.reduce(
      (s, r) => s + (r.impactSummary?.contribution?.value ?? 0),
      0,
    );
    const totalImpact = bucket.reduce(
      (s, r) => s + (r.impactSummary?.impact?.value ?? 0),
      0,
    );
    const contribUnit = first.impactSummary?.contribution?.unitOfMeasure ?? "";
    const impactUnit = first.impactSummary?.impact?.unitOfMeasure ?? "";

    return {
      ...first,
      impactSummary: {
        contribution: {
          ...(first.impactSummary?.contribution ?? {}),
          value: totalContrib,
          displayName: `${totalContrib.toLocaleString(locale, { maximumFractionDigits: 2 })} ${contribUnit}`,
        },
        impact: {
          ...(first.impactSummary?.impact ?? {}),
          value: totalImpact,
          displayName: `${totalImpact.toLocaleString(locale, { maximumFractionDigits: 2 })} ${impactUnit}`,
        },
      },
    };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loginData, loading } = useAuth();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tHome = useTranslations("home");
  const locale = useLocale();
  const [showLanguage, setShowLanguage] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const ALL_MARKERS = [
    { key: "First Impact", label: t("markerFirstImpact"), icon: Zap },
    { key: "First Circle", label: t("markerFirstCircle"), icon: CheckCircle },
    { key: "Deep Roots", label: t("markerDeepRoots"), icon: Leaf },
    { key: "Range", label: t("markerRange"), icon: Compass },
    { key: "Sustained", label: t("markerSustained"), icon: Calendar },
    { key: "Witness", label: t("markerWitness"), icon: Eye },
    { key: "Originator", label: t("markerOriginator"), icon: Lightbulb },
    { key: "Multiplier", label: t("markerMultiplier"), icon: Shuffle },
  ];

  const meta = user?.user_metadata;
  const fullName =
    [meta?.firstName, meta?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Guardian";
  const joinDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const avatarUrl =
    meta?.avatarUrl ||
    loginData?.circles
      .flatMap((c) => c.members)
      .find((m) => m.userId === user?.id)?.avatarUrl ||
    loginData?.challenges
      .flatMap((c) => c.members ?? [])
      .find((m) => m.userId === user?.id)?.avatarUrl;

  const userRecords = loginData?.impactRecords ?? [];
  const circleRecords = PROFILE_CONFIG.aggregateUserCircleImpact
    ? aggregateUserCircleImpact(loginData?.circles ?? [], locale)
    : (loginData?.circles ?? []).flatMap((c) => c.impactRecords ?? []);

  const [activeTab, setActiveTab] = useState<"challenges" | "circles" | null>(
    null,
  );
  const [expandedImpact, setExpandedImpact] = useState<number | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<{
    label: string;
    Icon: React.ElementType;
    api: ContributionMarker | undefined;
  } | null>(null);

  const challengesCount = loginData?.challengesCount?.total ?? 0;
  const circlesCount = loginData?.circlesCount?.total ?? 0;
  const location = meta?.location;
  const locationLabel =
    (location as { address?: string; formattedAddress?: string } | undefined)
      ?.address ||
    (location as { formattedAddress?: string } | undefined)?.formattedAddress;

  const earnedNames = new Set(
    (loginData?.contributionMarkers ?? [])
      .filter((m) => m.obtained)
      .map((m) => m.name.toUpperCase()),
  );

  if (loading) {
    return (
      <div className="flex flex-col min-h-full bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-7.5 pt-12 pb-4">
          <img src="/images/Guardians Logo-logo.png" alt="" className="w-8 h-8 object-contain" />
          <button onClick={() => router.back()}><X size={20} className="opacity-30 text-black" /></button>
        </div>
        {/* Identity */}
        <div className="flex flex-col items-center gap-2 pb-6 pt-2">
          <Skeleton className="w-30 h-30 rounded-full border-2 border-border mb-3" />
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-20 mt-1" />
          <Skeleton className="h-5 w-28 mt-1" />
          <Skeleton className="h-4 w-36 mt-1" />
        </div>
        {/* Stats bar */}
        <div className="flex border-y border-progress-track mx-7.5">
          <div className="flex-1 flex flex-col items-center py-4 gap-1.5">
            <Skeleton className="h-7 w-10" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="w-px bg-progress-track" />
          <div className="flex-1 flex flex-col items-center py-4 gap-1.5">
            <Skeleton className="h-7 w-10" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        {/* Settings list */}
        <div className="border-t border-progress-track mt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-7.5 py-6 border-b border-progress-track">
              <Skeleton className="size-5 rounded-sm" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-white fade-up">
      {/* Top bar */}
      <div className="flex items-center justify-between px-7.5 pt-12 pb-4">
        <img
          src="/images/Guardians Logo-logo.png"
          alt={t("guardian")}
          className="w-8 h-8 object-contain"
        />
        <button onClick={() => router.back()} aria-label={tCommon("close")}>
          <X size={20} className="opacity-30 text-black" />
        </button>
      </div>

      {/* Identity */}
      <div className="flex flex-col items-center gap-1 pb-6 pt-2">
        <Avatar src={avatarUrl} alt={fullName} className="w-30 h-30 rounded-full border-2 border-border mb-3" />
        <div className="flex items-center gap-2">
          <h1 className="text-[32px] font-bold text-black leading-tight">
            {fullName}
          </h1>
          <button onClick={() => router.push("/profile/edit")} aria-label={t("editProfile")} className="p-1 mt-1 shrink-0">
            <Pencil size={16} className="text-text-muted" />
          </button>
        </div>
        <p className="text-base font-medium text-text-muted mt-0.5">{t("guardian")}</p>
        <RoleBadge roles={computeGlobalRoles(user?.id, user?.email, loginData)} />
        {joinDate && (
          <p className="text-base text-text-secondary">{t("joined", { date: joinDate })}</p>
        )}
        {locationLabel && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={13} className="text-gotf-green shrink-0" />
            <p className="text-sm text-text-muted">{locationLabel}</p>
          </div>
        )}
      </div>

      {/* Challenges / Circles count bar */}
      {(challengesCount > 0 || circlesCount > 0) && (
        <>
          <div className="flex border-y border-progress-track mx-7.5">
            <button
              onClick={() =>
                setActiveTab(activeTab === "challenges" ? null : "challenges")
              }
              className={`flex-1 flex flex-col items-center py-4 gap-0.5 transition-colors ${activeTab === "challenges" ? "bg-surface" : ""}`}
            >
              <p className="text-2xl font-bold text-text-subheading">
                {challengesCount}
              </p>
              <span
                className={`flex items-center gap-1 ${activeTab === "challenges" ? "text-gotf-green" : "text-text-muted"}`}
              >
                <Text variant="caption">{t("challenges")}</Text>
                {activeTab === "challenges" ? (
                  <ChevronUp size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
              </span>
            </button>
            <div className="w-px bg-progress-track" />
            <button
              onClick={() =>
                setActiveTab(activeTab === "circles" ? null : "circles")
              }
              className={`flex-1 flex flex-col items-center py-4 gap-0.5 transition-colors ${activeTab === "circles" ? "bg-surface" : ""}`}
            >
              <p className="text-2xl font-bold text-text-subheading">
                {circlesCount}
              </p>
              <span
                className={`flex items-center gap-1 ${activeTab === "circles" ? "text-gotf-green" : "text-text-muted"}`}
              >
                <Text variant="caption">{t("circles")}</Text>
                {activeTab === "circles" ? (
                  <ChevronUp size={12} />
                ) : (
                  <ChevronDown size={12} />
                )}
              </span>
            </button>
          </div>

          {/* Expandable challenges list */}
          {activeTab === "challenges" && (
            <div className="flex flex-col gap-2 px-7.5 py-3 border-b border-progress-track">
              {(loginData?.challenges ?? []).length === 0 ? (
                <p className="text-sm text-text-muted text-center py-2">
                  {t("noChallenges")}
                </p>
              ) : (
                (loginData?.challenges ?? []).map((ch) => (
                  <div
                    key={ch.challengeId}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3"
                  >
                    <div className="size-10 rounded-lg bg-zinc-200 overflow-hidden shrink-0">
                      {ch.bannerUrl ? (
                        <img
                          src={ch.bannerUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src="/images/Guardians Logo-full.png"
                          alt=""
                          className="w-full h-full object-contain p-2 opacity-20"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary leading-tight truncate">
                        {ch.name}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5 truncate">
                        {ch.region?.formattedAddress ||
                          [ch.region?.city, ch.region?.province]
                            .filter(Boolean)
                            .join(", ")}
                      </p>
                    </div>
                    {(ch.membersCount?.total ?? ch.members?.length ?? 0) > 0 && (
                      <span className="text-xs text-text-muted shrink-0">
                        {(() => { const n = ch.membersCount?.total ?? ch.members?.length ?? 0; return `${n} ${n === 1 ? t("guardian") : t("guardians")}`; })()}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Expandable circles list */}
          {activeTab === "circles" && (
            <div className="flex flex-col gap-2 px-7.5 py-3 border-b border-progress-track">
              {(loginData?.circles ?? []).length === 0 ? (
                <p className="text-sm text-text-muted text-center py-2">
                  {t("noCircles")}
                </p>
              ) : (
                (loginData?.circles ?? []).map((ci) => (
                  <div
                    key={ci.circleId}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3"
                  >
                    <div className="size-10 rounded-lg bg-zinc-200 overflow-hidden shrink-0">
                      {ci.bannerUrl ? (
                        <img
                          src={ci.bannerUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src="/images/Guardians Logo-full.png"
                          alt=""
                          className="w-full h-full object-contain p-2 opacity-20"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary leading-tight truncate">
                        {ci.name}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5 truncate">
                        {ci.region?.formattedAddress ||
                          [ci.region?.city, ci.region?.province]
                            .filter(Boolean)
                            .join(", ")}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-text-muted shrink-0">
                      {(() => { const n = ci.membersCount?.total ?? ci.members?.length ?? 0; return `${n} ${n === 1 ? t("guardian") : t("guardians")}`; })()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Impact stats */}
      {userRecords.length > 0 && (
        <div className="px-7.5">
          <p className="pt-7.5 pb-4 px-1 text-xl font-bold text-text-subheading">
            {tHome("myImpact")}
          </p>
          {userRecords.map((ur, i) => {
            const cr = circleRecords.find((r) => r.siUnit === ur.siUnit);
            const unit = ur.impactSummary.contribution.unitOfMeasure;
            const contributionOnly = isContributionOnlyImpact(ur);
            const isOpen = !contributionOnly && expandedImpact === i;
            return (
              <div key={ur.impactRecordId ?? i}>
                <button
                  onClick={() => !contributionOnly && setExpandedImpact(isOpen ? null : i)}
                  className="flex items-end w-full border-b border-progress-track"
                >
                  <div className="flex-1 flex flex-col gap-2 pt-6 pb-5 px-1 text-left">
                    <Text variant="caption" className="text-text-muted">
                      {t("myUnit", { unit })}
                    </Text>
                    <p className="text-2xl font-semibold text-text-subheading">
                      {ur.impactSummary.contribution.displayName}
                    </p>
                  </div>
                  <div className="flex-1 flex flex-col gap-2 pt-6 pb-5 px-1 text-left">
                    <Text variant="caption" className="text-text-muted">
                      {t("circleUnit", { unit })}
                    </Text>
                    <p className="text-2xl font-semibold text-text-subheading">
                      {cr?.impactSummary.contribution.displayName ?? "—"}
                    </p>
                  </div>
                  {!contributionOnly && (
                    <div className="pb-6 pl-2 shrink-0">
                      {isOpen ? (
                        <ChevronUp size={14} className="text-text-muted" />
                      ) : (
                        <ChevronDown size={14} className="text-text-muted" />
                      )}
                    </div>
                  )}
                </button>
                {isOpen && (
                  <div className="px-1 pt-3 pb-5 border-b border-progress-track flex flex-col gap-2.5">
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {ur.impactSummary.impact.summary}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs border border-border rounded-full px-2.5 py-0.5 text-text-muted">
                        {ur.impactType}
                      </span>
                      <span className="text-xs text-text-muted">
                        → {ur.impactSummary.impact.displayName}
                      </span>
                      {ur.verified && (
                        <span className="text-xs bg-green-50 border border-gotf-green text-gotf-green rounded-full px-2.5 py-0.5 flex items-center gap-1">
                          <CheckCircle size={10} />
                          {t("verified")}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* The Trace */}
      <div className="pb-6 border-t border-progress-track">
        <Text variant="label" className="block px-7.5 mt-5 mb-3">
          {t("theTrace")}
        </Text>
        {user?.id && <RecentActivitiesList userId={user.id} />}
      </div>

      {/* Contribution markers */}
      <div className="px-7.5 pt-6 pb-5 border-t border-progress-track">
        <Text variant="label" className="block mb-3">
          {t("contributionMarkers")}
        </Text>
        <div className="flex flex-wrap gap-2">
          {ALL_MARKERS.map(({ key, label, icon: Icon }) => {
            const earned = earnedNames.has(key.toUpperCase());
            const api = (loginData?.contributionMarkers ?? []).find(
              (m) => m.name.toUpperCase() === key.toUpperCase(),
            );
            return (
              <button
                key={label}
                onClick={() => setSelectedMarker({ label, Icon, api })}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-medium transition-opacity ${
                  earned
                    ? "bg-green-50 border-gotf-green text-gotf-green"
                    : "bg-white border-border text-text-muted opacity-40"
                }`}
              >
                <Icon size={12} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings list */}
      <div className="border-t border-progress-track">
        <button
          onClick={() => router.push("/profile/edit")}
          className="flex items-center justify-between w-full px-7.5 py-6 border-b border-progress-track"
        >
          <div className="flex items-center gap-3">
            <User size={18} className="text-text-muted" />
            <span className="text-base font-medium text-black">
              {tCommon("accountDetails")}
            </span>
          </div>
          <ChevronRight size={20} className="text-text-muted" />
        </button>

        {/* Notifications — pending endpoint */}
        {/* <button className="flex items-center justify-between w-full px-7.5 py-6 border-b border-progress-track">
          <span className="text-base font-medium text-black">Notifications</span>
          <ChevronRight size={20} className="text-text-muted" />
        </button> */}

        <button
          onClick={() => setShowLocation(true)}
          className="flex items-center justify-between w-full px-7.5 py-6 border-b border-progress-track"
        >
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-text-muted" />
            <span className="text-base font-medium text-black">{tCommon("locationTitle")}</span>
          </div>
          <ChevronRight size={20} className="text-text-muted" />
        </button>

        {/* Settings — pending endpoint */}
        {/* <button className="flex items-center justify-between w-full px-7.5 py-6 border-b border-progress-track">
          <span className="text-base font-medium text-black">Settings</span>
          <ChevronRight size={20} className="text-text-muted" />
        </button> */}

        {/* Language */}
        <button
          onClick={() => setShowLanguage(true)}
          className="flex items-center justify-between w-full px-7.5 py-6 border-b border-progress-track"
        >
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-text-muted" />
            <span className="text-base font-medium text-black">{tCommon("language")}</span>
          </div>
          <ChevronRight size={20} className="text-text-muted" />
        </button>

        {/* Replay intro */}
        <button
          onClick={() => { localStorage.removeItem("gotf_splash_seen"); router.push("/splash"); }}
          className="flex items-center justify-between w-full px-7.5 py-6 border-b border-progress-track"
        >
          <div className="flex items-center gap-3">
            <Play size={18} className="text-text-muted" />
            <span className="text-base font-medium text-black">{t("replayIntro")}</span>
          </div>
          <ChevronRight size={20} className="text-text-muted" />
        </button>

        {/* Terms & Conditions */}
        <Link
          href="/terms"
          className="flex items-center justify-between w-full px-7.5 py-6 border-b border-progress-track"
        >
          <div className="flex items-center gap-3">
            <ScrollText size={18} className="text-text-muted" />
            <span className="text-base font-medium text-black">{t("termsAndConditions")}</span>
          </div>
          <ChevronRight size={20} className="text-text-muted" />
        </Link>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-7.5 py-6 border-b border-progress-track"
        >
          <LogOut size={18} className="text-red-500" />
          <span className="text-base font-medium text-red-500">{t("logOut")}</span>
        </button>
      </div>

      {showLanguage && (
        <LanguageSwitcher onClose={() => setShowLanguage(false)} />
      )}
      {showLocation && meta?.location && (
        <LocationSheet
          location={meta.location}
          onClose={() => setShowLocation(false)}
        />
      )}

      {selectedMarker && (() => {
        const { label, Icon, api } = selectedMarker;
        const earned = api?.obtained ?? false;
        return (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setSelectedMarker(null)}
              aria-hidden
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center px-6 pointer-events-none">
              <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl pointer-events-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-progress-track">
                  <p className="text-base font-semibold text-black">{label}</p>
                  <button
                    onClick={() => setSelectedMarker(null)}
                    aria-label={tCommon("close")}
                    className="text-text-muted"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 flex flex-col gap-5">
                  {/* Icon + earned badge */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`size-16 rounded-2xl flex items-center justify-center shrink-0 ${
                        earned ? "bg-green-50" : "bg-surface opacity-50"
                      }`}
                    >
                      <Icon size={28} className={earned ? "text-gotf-green" : "text-text-muted"} />
                    </div>
                    <span
                      className={`text-xs font-semibold rounded-full px-3 py-1 border ${
                        earned
                          ? "bg-green-50 border-gotf-green text-gotf-green"
                          : "bg-white border-border text-text-muted"
                      }`}
                    >
                      {earned ? t("verified") : t("noMarkersEarned")}
                    </span>
                  </div>

                  {/* Description */}
                  {api?.description && (
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {api.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
