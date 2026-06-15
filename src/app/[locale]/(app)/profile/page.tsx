"use client";

import {
  ChevronRight,
  X,
  User,
  LogOut,
  Globe,
  Zap,
  CheckCircle,
  Leaf,
  Compass,
  Calendar,
  Eye,
  Lightbulb,
  Shuffle,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Text from "@/components/ui/Text";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useState } from "react";

const ALL_MARKERS = [
  { label: "First Impact",  icon: Zap         },
  { label: "First Circle",  icon: CheckCircle },
  { label: "Deep Roots",    icon: Leaf        },
  { label: "Range",         icon: Compass     },
  { label: "Sustained",     icon: Calendar    },
  { label: "Witness",       icon: Eye         },
  { label: "Originator",    icon: Lightbulb   },
  { label: "Multiplier",    icon: Shuffle     },
];

const settingsItems = ["Account Details", "Notifications", "Location", "Settings"];

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

  const meta = user?.user_metadata;
  const fullName =
    [meta?.firstName, meta?.lastName].filter(Boolean).join(" ") ||
    user?.email ||
    "Guardian";
  const joinDate = user?.created_at ? formatJoinDate(user.created_at) : "";

  const avatarUrl =
    meta?.avatarUrl ||
    loginData?.circles.flatMap((c) => c.members).find((m) => m.userId === user?.id)?.avatarUrl ||
    loginData?.challenges.flatMap((c) => c.members ?? []).find((m) => m.userId === user?.id)?.avatarUrl;

  const userRecords = loginData?.impactRecords ?? [];
  const circleRecords = (loginData?.circles ?? []).flatMap((c) => c.impactRecords ?? []);
  const impactStats = userRecords.slice(0, 3).flatMap((ur, i) => {
    const cr = circleRecords[i];
    const label = ur.impactSummary.contribution.unitOfMeasure;
    return [
      { label: `My ${label}`,      value: ur.impactSummary.contribution.displayName },
      { label: `Circle ${label}`,  value: cr?.impactSummary.contribution.displayName ?? "—" },
    ];
  });

  // contributionMarkers shape is TBD — treat any non-null value as "has earned markers"
  const earnedLabels: Set<string> = new Set();
  const hasTrace = false; // no endpoint yet

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
      <div className="flex flex-col items-center gap-1 pb-8 pt-2">
        <div className="w-30 h-30 rounded-full bg-surface border-2 border-border flex items-center justify-center mb-3 overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <User size={48} className="text-text-muted" />
          )}
        </div>
        <h1 className="text-[32px] font-bold text-black leading-tight">{fullName}</h1>
        <p className="text-base font-medium text-text-muted mt-0.5">Guardian</p>
        {joinDate && (
          <p className="text-base text-text-secondary">Joined {joinDate}</p>
        )}
      </div>

      {/* Impact stats */}
      {impactStats.length > 0 ? (
        <div className="px-7.5">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex">
              {impactStats.slice(row * 2, row * 2 + 2).map(({ label, value }) => (
                <div
                  key={label}
                  className="flex-1 flex flex-col gap-2 pt-6 pb-8 px-1 border-b border-progress-track"
                >
                  <Text variant="caption" className="text-text-muted">{label}</Text>
                  <p className="text-2xl font-semibold text-text-subheading">{value}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-7.5 mb-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-8">
          <img
            src="/images/Guardians Logo-full.png"
            alt=""
            className="w-10 h-10 object-contain opacity-20"
          />
          <p className="text-sm text-text-muted text-center">No impact recorded yet. Complete a challenge to see your stats here.</p>
        </div>
      )}

      {/* Contribution markers */}
      <div className="px-7.5 pt-6 pb-5 border-t border-progress-track">
        <Text variant="label" className="block mb-3">Contribution markers</Text>
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
          <p className="text-xs text-text-muted mt-3">None earned yet — keep contributing to unlock markers.</p>
        )}
      </div>

      {/* The Trace */}
      <div className="px-7.5 pb-6 border-t border-progress-track">
        <Text variant="label" className="block mt-5 mb-3">The Trace</Text>
        {hasTrace ? (
          <div className="flex flex-col divide-y divide-progress-track">
            {/* rendered when trace endpoint is available */}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-5 py-5">
            <img
              src="/images/Guardians Logo-full.png"
              alt=""
              className="w-8 h-8 object-contain opacity-20 shrink-0"
            />
            <p className="text-sm text-text-muted">No activity recorded yet. Your challenge history will appear here.</p>
          </div>
        )}
      </div>

      {/* Settings list */}
      <div className="border-t border-progress-track">
        {settingsItems.map((item) => (
          <div
            key={item}
            className="flex items-center justify-between px-7.5 py-6 border-b border-progress-track"
          >
            <span className="text-base font-medium text-black">{item}</span>
            <ChevronRight size={20} className="text-text-muted" />
          </div>
        ))}

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

      {showLanguage && <LanguageSwitcher onClose={() => setShowLanguage(false)} />}
    </div>
  );
}
