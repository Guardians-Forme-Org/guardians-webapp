"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import { api } from "@/lib/api";
import type { CirclesListResponse } from "@/lib/types/circles";
import { useChallenges } from "@/lib/hooks/challenges";
import ChallengeCard from "@/features/challenges/components/ChallengeCard";

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
        <p className="text-[14px] text-text-subheading mt-1">Since {item.since}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <MapPin size={11} className="text-text-muted shrink-0" />
          <p className="text-[14px] text-text-muted truncate">{item.location}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pb-1">
          <p className="text-[14px] text-text-muted">
            <span className="font-bold">{item.members}</span> Members
          </p>
          <AvatarStack avatars={item.memberAvatars} />
        </div>
      </div>
    </Link>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function DiscoverScreen() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("challenges");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const { data: apiCircles, isLoading: circlesLoading } = useQuery({
    queryKey: ["circles"],
    queryFn: () => api.get<CirclesListResponse>("/circles"),
  });

  const { data: apiChallenges, isLoading: challengesLoading } = useChallenges();

  const lq = query.toLowerCase();
  const filteredChallenges = (apiChallenges ?? []).filter(
    (c) => !lq || c.name.toLowerCase().includes(lq),
  );

  return (
    <div className="flex flex-col min-h-full bg-white">

      {/* Header */}
      <div className="px-10 pt-8 pb-6">
        <h1 className="text-[32px] font-bold text-black">Discover</h1>
      </div>

      <div className="border-t border-progress-track" />

      {/* Tab switcher */}
      <div className="flex justify-center py-4">
        <div className="flex">
          {(["challenges", "circles"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`h-[34px] w-[131px] rounded-full text-base text-text-subheading capitalize transition-colors ${
                tab === t ? "bg-[#f0f0f0]" : ""
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <SearchBar
        defaultValue={query}
        placeholder={tab === "challenges" ? "Find challenges near you" : "Find circles near you"}
        onSubmit={setQuery}
      />

      {/* Create CTA — only available on circles tab; challenges must start from within a circle */}
      {tab === "circles" && (
        <div className="px-5 mb-6">
          <Link
            href="/circles/create"
            className="flex items-center justify-center w-full h-14 bg-black text-white rounded-full text-lg font-medium"
          >
            Create Circle
          </Link>
        </div>
      )}

      {/* Cards */}
      <div className="px-5 flex flex-col gap-4 pb-8">
        {tab === "challenges"
          ? challengesLoading
            ? <p className="text-sm text-text-muted text-center pt-6">Loading challenges…</p>
            : filteredChallenges.map((c) => <ChallengeCard key={c.challengeId} item={c} />)
          : circlesLoading
            ? <p className="text-sm text-text-muted text-center pt-6">Loading circles…</p>
            : (apiCircles ?? [])
                .filter((c) => !lq || c.name.toLowerCase().includes(lq))
                .map((c) => (
                  <CircleCard
                    key={c.id}
                    item={{
                      id: c.circleId,
                      name: c.name,
                      since: new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" }),
                      location: c.region.formattedAddress || [c.region.city, c.region.province].filter(Boolean).join(", ") || "—",
                      members: c.membersCount?.total ?? c.members.length,
                      memberAvatars: c.members.map((m) => m.avatarUrl),
                      image: c.bannerUrl || undefined,
                    }}
                  />
                ))
        }
      </div>

    </div>
  );
}
