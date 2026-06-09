"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin } from "lucide-react";
import SearchBar from "@/components/ui/SearchBar";
import { api } from "@/lib/api";
import type { CirclesListResponse } from "@/lib/types/circles";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "challenges" | "circles";

type ChallengeItem = {
  id: number;
  title: string;
  since: string;
  circle: string;
  progress: number;
  guardians: number;
  image?: string;
};

type CircleItem = {
  id: string | number;
  name: string;
  since: string;
  location: string;
  members: number;
  memberAvatars: string[];
  image?: string;
};

// ── Data ──────────────────────────────────────────────────────────────────────

const challenges: ChallengeItem[] = [
  { id: 1, title: "Re-Greening",      since: "12 March",    circle: "Green Urban Youth", progress: 68, guardians: 17 },
  { id: 2, title: "Waste Compost",    since: "1 December",  circle: "Urban Watch",       progress: 68, guardians: 53 },
  { id: 3, title: "Change Tracking",  since: "24 February", circle: "Eco Homes",         progress: 68, guardians: 38 },
];

const circles: CircleItem[] = [
  { id: 1, name: "Green Urban Youth", since: "12 March",    location: "KwaZulu-Natal, Durban", members: 24, memberAvatars: [] },
  { id: 2, name: "Urban Watch",       since: "1 December",  location: "Umoja 1, Nairobi",      members: 12, memberAvatars: [] },
  { id: 3, name: "Eco Homes",         since: "24 February", location: "Langa, Cape Town",      members: 34, memberAvatars: [] },
];

// ── Avatar Stack ──────────────────────────────────────────────────────────────

function AvatarStack({ avatars }: { avatars: string[] }) {
  const visible = avatars.slice(0, 5);
  return (
    <div className="flex items-center">
      {visible.map((url, i) => (
        <div
          key={i}
          className={`size-8 rounded-full border-2 border-white overflow-hidden bg-[#d9d9d9] shrink-0 ${i > 0 ? "-ml-2" : ""}`}
        >
          {url ? (
            <img src={url} alt="" className="w-full h-full object-cover" />
          ) : null}
        </div>
      ))}
    </div>
  );
}

// ── Challenge Card ─────────────────────────────────────────────────────────────

function ChallengeCard({ item }: { item: ChallengeItem }) {
  return (
    <Link href={`/challenges/${item.id}`} className="flex h-40 rounded-[16px] border border-progress-track overflow-hidden bg-white">
      {/* Left image strip */}
      <div className="w-[120px] shrink-0 bg-surface">
        {item.image && (
          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
        )}
      </div>

      {/* Right content */}
      <div className="flex-1 relative overflow-hidden pt-[19px] px-4 pr-8 flex flex-col">
        <ArrowRight size={20} className="absolute right-3 top-4 text-text-muted" />

        <p className="text-[18px] font-bold text-text-subheading leading-tight">{item.title}</p>
        <p className="text-[14px] text-text-subheading mt-1">Since {item.since}</p>
        <p className="text-[14px] text-text-muted">by {item.circle}</p>

        {/* Progress bar */}
        <div className="mx-[-4px] mt-2.5 h-[4px] bg-[#787878] rounded-full overflow-hidden">
          <div className="h-full bg-gotf-yellow rounded-full" style={{ width: `${item.progress}%` }} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-[14px] text-text-muted">
            <span className="font-bold">{item.guardians}</span> Guardians
          </p>
          <AvatarStack avatars={[]} />
        </div>
      </div>
    </Link>
  );
}

// ── Circle Card ────────────────────────────────────────────────────────────────

function CircleCard({ item }: { item: CircleItem }) {
  return (
    <Link href={`/circles/${item.id}`} className="flex h-40 rounded-[16px] border border-progress-track overflow-hidden bg-white">
      {/* Left image strip */}
      <div className="w-[120px] shrink-0 bg-surface">
        {item.image && (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        )}
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
  const [tab, setTab] = useState<Tab>("challenges");

  const { data: apiCircles, isLoading: circlesLoading } = useQuery({
    queryKey: ["circles"],
    queryFn: () => api.get<CirclesListResponse>("/circles"),
  });

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
        placeholder={tab === "challenges" ? "Find challenges near you" : "Find circles near you"}
      />

      {/* Create CTA */}
      <div className="px-5 mb-6">
        <Link
          href={tab === "challenges" ? "/challenges/create" : "/circles/create"}
          className="flex items-center justify-center w-full h-14 bg-black text-white rounded-full text-lg font-medium"
        >
          {tab === "challenges" ? "Create Challenge" : "Create Circle"}
        </Link>
      </div>

      {/* Cards */}
      <div className="px-5 flex flex-col gap-4 pb-8">
        {tab === "challenges"
          ? challenges.map((c) => <ChallengeCard key={c.id} item={c} />)
          : circlesLoading
            ? <p className="text-sm text-text-muted text-center pt-6">Loading circles…</p>
            : (apiCircles ?? []).map((c) => (
                <CircleCard
                  key={c.id}
                  item={{
                    id: c.circleId,
                    name: c.name,
                    since: new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" }),
                    location: c.region.address || "—",
                    members: c.members.length,
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
