"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import SearchBar from "@/components/ui/SearchBar";
import SectionHeader from "@/components/ui/SectionHeader";
import ChallengeCard, { type Challenge } from "../components/ChallengeCard";
import CircleListItem, { type Circle } from "../components/CircleListItem";
import HomeHeader from "../components/HomeHeader";
import ImpactSection from "../components/ImpactSection";
import LocationPill from "../components/LocationPill";

const continueChallenges: Challenge[] = [
  {
    id: 1,
    title: "Separate plastic b...",
    challengeName: "Plastic Free Challenge",
    circleName: "Soweto Green Circle",
    currentStep: 2,
    totalSteps: 5,
  },
  {
    id: 2,
    title: "Plant seeds",
    challengeName: "1 Tree at a Time Challenge",
    circleName: "Jozi Youth",
    currentStep: 11,
    totalSteps: 15,
  },
];

const circles: Circle[] = [
  { id: 1, rank: 1, name: "Green Urban Youth", joinDate: "12 March" },
  { id: 2, rank: 2, name: "Park Watch", joinDate: "1 December" },
  { id: 3, rank: 3, name: "Eco Homes", joinDate: "24 February" },
];

const badgeStats = [
  { label: "Avoided CO₂", value: "20kg" },
  { label: "Generated Area", value: "750m²" },
  { label: "Processed Waste", value: "32kg" },
];

const activityStats = [
  { label: "Challenges", value: "4" },
  { label: "Circles", value: "2" },
  { label: "", value: "" },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const displayName =
    user?.user_metadata.firstName ||
    user?.email?.split("@")[0] ||
    "Guardian";

  return (
    <div className="flex flex-col min-h-full bg-white gap-4">
      <HomeHeader name={displayName} avatarUrl={user?.user_metadata.avatarUrl} hasNotification />
      <SearchBar
        onSubmit={(q) => router.push(`/discover${q ? `?q=${encodeURIComponent(q)}` : ""}`)}
      />
      <LocationPill
        city={user?.user_metadata.location.city || user?.user_metadata.location.formattedAddress || user?.user_metadata.location.address || ""}
        country={user?.user_metadata.location.country || ""}
      />

      <ImpactSection badgeStats={badgeStats} activityStats={activityStats} />

      {/* Continue */}
      <section className="mb-6">
        <div className="px-5">
          <SectionHeader title="Active Challenges" href="/discover" />
        </div>
        <div className="flex gap-3 pl-5 overflow-x-auto no-scrollbar pb-1">
          {continueChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
          <div className="w-5 shrink-0" aria-hidden="true" />
        </div>
      </section>

      {/* Circles — floating panel */}
      <section className="bg-white rounded-t-[20px] shadow-[0_-5px_20px_0_rgba(0,0,0,0.05)] px-5 pt-6 pb-8 -mt-2">
        <SectionHeader title="Active Circles" href="/discover" />
        <div className="flex flex-col gap-7.5">
          {circles.map((circle) => (
            <CircleListItem key={circle.id} circle={circle} />
          ))}
        </div>
      </section>
    </div>
  );
}
