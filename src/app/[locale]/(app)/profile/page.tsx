"use client";

import AccountDetailsSheet from "@/components/ui/AccountDetailsSheet";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import LocationSheet from "@/components/ui/LocationSheet";
import RecentActivitiesList from "@/components/ui/RecentActivitiesList";
import Text from "@/components/ui/Text";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "@/i18n/navigation";
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
  Shuffle,
  User,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

const ALL_MARKERS = [
  { label: "First Impact", icon: Zap },
  { label: "First Circle", icon: CheckCircle },
  { label: "Deep Roots", icon: Leaf },
  { label: "Range", icon: Compass },
  { label: "Sustained", icon: Calendar },
  { label: "Witness", icon: Eye },
  { label: "Originator", icon: Lightbulb },
  { label: "Multiplier", icon: Shuffle },
];

function formatJoinDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, loginData } = useAuth();
  const [showLanguage, setShowLanguage] = useState(false);
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showLocation, setShowLocation] = useState(false);

  const meta = user?.user_metadata;
  const fullName =
    [meta?.firstName, meta?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Guardian";
  const joinDate = user?.created_at ? formatJoinDate(user.created_at) : "";

  const avatarUrl =
    meta?.avatarUrl ||
    loginData?.circles
      .flatMap((c) => c.members)
      .find((m) => m.userId === user?.id)?.avatarUrl ||
    loginData?.challenges
      .flatMap((c) => c.members ?? [])
      .find((m) => m.userId === user?.id)?.avatarUrl;

  const userRecords = loginData?.impactRecords ?? [];
  const circleRecords = (loginData?.circles ?? []).flatMap(
    (c) => c.impactRecords ?? [],
  );

  const [activeTab, setActiveTab] = useState<"challenges" | "circles" | null>(
    null,
  );
  const [expandedImpact, setExpandedImpact] = useState<number | null>(null);

  const challengesCount = loginData?.challengesCount?.total ?? 0;
  const circlesCount = loginData?.circlesCount?.total ?? 0;
  const location = meta?.location;
  const locationLabel =
    (location as { address?: string; formattedAddress?: string } | undefined)
      ?.address ||
    (location as { formattedAddress?: string } | undefined)?.formattedAddress;

  const earnedLabels: Set<string> = new Set();

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-7.5 pt-12 pb-4">
        <img
          src="/images/Guardians Logo-logo.png"
          alt="Guardians logo"
          className="w-8 h-8 object-contain"
        />
        <button onClick={() => router.back()} aria-label="Close">
          <X size={20} className="opacity-30 text-black" />
        </button>
      </div>

      {/* Identity */}
      <div className="flex flex-col items-center gap-1 pb-6 pt-2">
        <div className="w-30 h-30 rounded-full bg-surface border-2 border-border flex items-center justify-center mb-3 overflow-hidden">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={48} className="text-text-muted" />
          )}
        </div>
        <h1 className="text-[32px] font-bold text-black leading-tight">
          {fullName}
        </h1>
        <p className="text-base font-medium text-text-muted mt-0.5">Guardian</p>
        {joinDate && (
          <p className="text-base text-text-secondary">Joined {joinDate}</p>
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
                <Text variant="caption">Challenges</Text>
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
                <Text variant="caption">Circles</Text>
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
                  No challenges yet.
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
                            .join(", ") ||
                          ch.status?.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs font-medium text-text-muted bg-surface rounded-full px-2 py-0.5">
                        {ch.status?.name}
                      </span>
                      {(ch.membersCount?.total ?? ch.members?.length ?? 0) >
                        0 && (
                        <span className="text-xs text-text-muted">
                          {ch.membersCount?.total ?? ch.members?.length}{" "}
                          guardians
                        </span>
                      )}
                    </div>
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
                  No circles yet.
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
                      {ci.membersCount?.total ?? ci.members?.length ?? 0}{" "}
                      guardians
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Impact stats */}
      {userRecords.length > 0 ? (
        <div className="px-7.5">
          {userRecords.map((ur, i) => {
            const cr = circleRecords.find((r) => r.siUnit === ur.siUnit);
            const unit = ur.impactSummary.contribution.unitOfMeasure;
            const isOpen = expandedImpact === i;
            return (
              <div key={ur.impactRecordId ?? i}>
                <button
                  onClick={() => setExpandedImpact(isOpen ? null : i)}
                  className="flex items-end w-full border-b border-progress-track"
                >
                  <div className="flex-1 flex flex-col gap-2 pt-6 pb-5 px-1 text-left">
                    <Text variant="caption" className="text-text-muted">
                      My {unit}
                    </Text>
                    <p className="text-2xl font-semibold text-text-subheading">
                      {ur.impactSummary.contribution.displayName}
                    </p>
                  </div>
                  <div className="flex-1 flex flex-col gap-2 pt-6 pb-5 px-1 text-left">
                    <Text variant="caption" className="text-text-muted">
                      Circle {unit}
                    </Text>
                    <p className="text-2xl font-semibold text-text-subheading">
                      {cr?.impactSummary.contribution.displayName ?? "—"}
                    </p>
                  </div>
                  <div className="pb-6 pl-2 shrink-0">
                    {isOpen ? (
                      <ChevronUp size={14} className="text-text-muted" />
                    ) : (
                      <ChevronDown size={14} className="text-text-muted" />
                    )}
                  </div>
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
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mx-7.5 mb-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-8">
          <img
            src="/images/Guardians Logo-full.png"
            alt=""
            className="w-10 h-10 object-contain opacity-20"
          />
          <p className="text-sm text-text-muted text-center">
            No impact recorded yet. Complete a challenge to see your stats here.
          </p>
        </div>
      )}

      {/* The Trace */}
      <div className="pb-6 border-t border-progress-track">
        <Text variant="label" className="block px-7.5 mt-5 mb-3">
          The Trace
        </Text>
        {user?.id && <RecentActivitiesList userId={user.id} />}
      </div>

      {/* Contribution markers */}
      <div className="px-7.5 pt-6 pb-5 border-t border-progress-track">
        <Text variant="label" className="block mb-3">
          Contribution markers
        </Text>
        <div className="flex flex-wrap gap-2">
          {ALL_MARKERS.map(({ label, icon: Icon }) => {
            const earned = earnedLabels.has(label);
            return (
              <div
                key={label}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-medium transition-opacity ${
                  earned
                    ? "bg-green-50 border-gotf-green text-gotf-green"
                    : "bg-white border-border text-text-muted opacity-40"
                }`}
              >
                <Icon size={12} />
                <span>{label}</span>
              </div>
            );
          })}
        </div>
        {earnedLabels.size === 0 && (
          <p className="text-xs text-text-muted mt-3">
            None earned yet — keep contributing to unlock markers.
          </p>
        )}
      </div>

      {/* Settings list */}
      <div className="border-t border-progress-track">
        <button
          onClick={() => setShowAccountDetails(true)}
          className="flex items-center justify-between w-full px-7.5 py-6 border-b border-progress-track"
        >
          <div className="flex items-center gap-3">
            <User size={18} className="text-text-muted" />
            <span className="text-base font-medium text-black">
              Account Details
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
            <span className="text-base font-medium text-black">Location</span>
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
            <span className="text-base font-medium text-black">Language</span>
          </div>
          <ChevronRight size={20} className="text-text-muted" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-7.5 py-6 border-b border-progress-track"
        >
          <LogOut size={18} className="text-red-500" />
          <span className="text-base font-medium text-red-500">Log Out</span>
        </button>
      </div>

      {showLanguage && (
        <LanguageSwitcher onClose={() => setShowLanguage(false)} />
      )}
      {showAccountDetails && user && (
        <AccountDetailsSheet
          user={user}
          avatarUrl={avatarUrl}
          onClose={() => setShowAccountDetails(false)}
        />
      )}
      {showLocation && meta?.location && (
        <LocationSheet
          location={meta.location}
          onClose={() => setShowLocation(false)}
        />
      )}
    </div>
  );
}
