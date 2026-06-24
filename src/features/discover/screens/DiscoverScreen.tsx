"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronRight, MapPin } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { isWhitelisted, isCircleLead } from "@/lib/permissions";
import type { ApiCircle, CirclesListResponse } from "@/lib/types/circles";
import { useChallenges } from "@/lib/hooks/challenges";
import ChallengeCard from "@/features/challenges/components/ChallengeCard";
import { useTranslations, useLocale } from "next-intl";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "challenges" | "circles";

function AvatarStack({ avatars }: { avatars: string[] }) {
  return (
    <div className="flex items-center">
      {avatars.slice(0, 5).map((url, i) => (
        <div
          key={i}
          className={`size-8 rounded-full border-2 border-white overflow-hidden bg-[#d9d9d9] shrink-0 ${i > 0 ? "-ml-2" : ""}`}
        >
          {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : null}
        </div>
      ))}
    </div>
  );
}

type CircleItem = {
  id: string | number;
  name: string;
  since: string;
  location: string;
  members: number;
  memberAvatars: string[];
  image?: string;
};

// ── Circle Card ────────────────────────────────────────────────────────────────

function CircleCard({ item }: { item: CircleItem }) {
  const t = useTranslations("discover");
  return (
    <Link href={`/circles/${item.id}`} className="flex h-40 rounded-[16px] border border-progress-track overflow-hidden bg-white">
      {/* Left image strip */}
      <div className="w-[120px] shrink-0 bg-surface flex items-center justify-center">
        <img
          src={item.image || "/images/Guardians Logo-logo.png"}
          alt={item.name}
          className={item.image ? "w-full h-full object-cover" : "w-14 h-14 object-contain opacity-20"}
        />
      </div>

      {/* Right content */}
      <div className="flex-1 relative overflow-hidden pt-[19px] px-4 pr-8 flex flex-col">
        <ArrowRight size={20} className="absolute right-3 top-4 text-text-muted" />

        <p className="text-[18px] font-bold text-text-subheading leading-tight">{item.name}</p>
        <p className="text-[14px] text-text-subheading mt-1">{t("since", { date: item.since })}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin size={11} className="text-text-muted shrink-0" />
          <p className="text-[14px] text-text-muted truncate">{item.location}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pb-1">
          <p className="text-[14px] text-text-muted">
            {t("members", { count: item.members })}
          </p>
          <AvatarStack avatars={item.memberAvatars} />
        </div>
      </div>
    </Link>
  );
}

// ── Circle Picker Sheet ────────────────────────────────────────────────────────

function CirclePickerSheet({
  circles,
  onClose,
}: {
  circles: ApiCircle[];
  onClose: () => void;
}) {
  const t = useTranslations("discover");
  const router = useRouter();
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[60]" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-[20px] z-[70] px-5 pt-5 pb-10">
        <div className="w-10 h-1 bg-[#d9d9d9] rounded-full mx-auto mb-6" />
        <p className="text-xl font-bold text-text-subheading mb-5">
          {t("circlePickerTitle")}
        </p>
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {circles.map((c) => (
            <button
              key={c.circleId}
              onClick={() =>
                router.push(`/challenges/create?circleId=${c.circleId}`)
              }
              className="flex items-center gap-4 h-16 px-4 border border-border rounded-[12px] text-left active:bg-surface"
            >
              <div className="size-10 rounded-full bg-surface overflow-hidden shrink-0">
                {c.bannerUrl && (
                  <img
                    src={c.bannerUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-text-primary truncate">
                  {c.name}
                </p>
                {c.region.city && (
                  <p className="text-xs text-text-muted">{c.region.city}</p>
                )}
              </div>
              <ChevronRight size={20} className="text-text-muted shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const t = useTranslations("discover");
  const locale = useLocale();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("challenges");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [showCirclePicker, setShowCirclePicker] = useState(false);

  const { data: apiCircles, isLoading: circlesLoading } = useQuery({
    queryKey: ["circles"],
    queryFn: () => api.get<CirclesListResponse>("/circles"),
  });

  const { data: apiChallenges, isLoading: challengesLoading } = useChallenges();

  // Only admins and circle leads can create challenges
  // Admins see all circles; circle leads see only their circles
  const myCircles = (apiCircles ?? []).filter((c) =>
    isWhitelisted(user?.email) || isCircleLead(user?.id, c),
  );

  const handleCreateChallenge = () => {
    if (myCircles.length === 1) {
      router.push(`/challenges/create?circleId=${myCircles[0].circleId}`);
    } else {
      setShowCirclePicker(true);
    }
  };

  const lq = query.toLowerCase();
  const filteredChallenges = (apiChallenges ?? []).filter(
    (c) => !lq || c.name.toLowerCase().includes(lq),
  );

  return (
    <div className="flex flex-col min-h-full bg-white">

      {/* Header */}
      <div className="px-10 pt-8 pb-6">
        <h1 className="text-[32px] font-bold text-black">{t("title")}</h1>
      </div>

      <div className="border-t border-progress-track" />

      {/* Tab switcher */}
      <div className="flex justify-center py-4">
        <div className="flex">
          {(["challenges", "circles"] as Tab[]).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`h-[34px] w-[131px] rounded-full text-base text-text-subheading capitalize transition-colors ${
                tab === tabKey ? "bg-[#f0f0f0]" : ""
              }`}
            >
              {tabKey === "challenges" ? t("tabChallenges") : t("tabCircles")}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <SearchBar
        defaultValue={query}
        placeholder={tab === "challenges" ? t("searchChallenges") : t("searchCircles")}
        onSubmit={setQuery}
      />

      {/* Create CTAs */}
      {tab === "circles" && isWhitelisted(user?.email) && (
        <div className="px-5 mb-6">
          <Link
            href="/circles/create"
            className="flex items-center justify-center w-full h-14 bg-black text-white rounded-full text-lg font-medium"
          >
            {t("createCircle")}
          </Link>
        </div>
      )}
      {tab === "challenges" && myCircles.length > 0 && (
        <div className="px-5 mb-6">
          <button
            onClick={handleCreateChallenge}
            className="flex items-center justify-center w-full h-14 bg-black text-white rounded-full text-lg font-medium"
          >
            {t("createChallenge")}
          </button>
        </div>
      )}

      {/* Cards */}
      <div className="px-5 flex flex-col gap-4 pb-8">
        {tab === "challenges"
          ? challengesLoading
            ? <p className="text-sm text-text-muted text-center pt-6">{t("loadingChallenges")}</p>
            : filteredChallenges.map((c) => <ChallengeCard key={c.challengeId} item={c} />)
          : circlesLoading
            ? <p className="text-sm text-text-muted text-center pt-6">{t("loadingCircles")}</p>
            : (apiCircles ?? [])
                .filter((c) => !lq || c.name.toLowerCase().includes(lq))
                .map((c) => (
                  <CircleCard
                    key={c.id}
                    item={{
                      id: c.circleId,
                      name: c.name,
                      since: new Date(c.createdAt).toLocaleDateString(locale, { day: "numeric", month: "long" }),
                      location: c.region.formattedAddress || [c.region.city, c.region.province].filter(Boolean).join(", ") || "—",
                      members: c.membersCount?.total ?? c.members.length,
                      memberAvatars: c.members.map((m) => m.avatarUrl),
                      image: c.bannerUrl || undefined,
                    }}
                  />
                ))
        }
      </div>

      {showCirclePicker && (
        <CirclePickerSheet
          circles={myCircles}
          onClose={() => setShowCirclePicker(false)}
        />
      )}
    </div>
  );
}
