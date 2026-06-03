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
  { label: "My Steps", value: "17" },
  { label: "My Challenges", value: "4" },
  { label: "My Circles", value: "2" },
];

export default function HomeScreen() {
  return (
    <div className="flex flex-col min-h-full bg-white gap-4">
      <HomeHeader name="Linda" hasNotification />
      <SearchBar />
      <LocationPill city="Brive-la-Gaillarde" country="France" />

      <ImpactSection badgeStats={badgeStats} activityStats={activityStats} />

      {/* Continue */}
      <section className="mb-6">
        <div className="px-5">
          <SectionHeader title="Active Challenges" href="/challenges" />
        </div>
        <div className="flex gap-3 pl-5 overflow-x-auto no-scrollbar pb-1">
          {continueChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
          <div className="w-5 shrink-0" aria-hidden="true" />
        </div>
      </section>

      {/* Circles */}
      <section className="px-5 mb-6">
        <SectionHeader title="Active Circles" href="/circles" />
        <div className="">
          {circles.map((circle) => (
            <CircleListItem key={circle.id} circle={circle} />
          ))}
        </div>
      </section>

    </div>
  );
}
