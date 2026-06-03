import { MapPin, ChevronRight, SlidersHorizontal } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import SearchBar from "@/components/ui/SearchBar";
import Text from "@/components/ui/Text";

const challenges = [
  {
    id: 1,
    title: "Re-Greening",
    circle: "Urban Greening",
    location: "KwaZulu-Natal, Durban",
    distance: "300m from you",
    guardians: 38,
    tag: "Environment",
    gradient: "from-[#003518] to-[#005c2b]",
  },
  {
    id: 2,
    title: "Waste Compost",
    circle: "Urban Watch",
    location: "Umoja 1, Nairobi",
    distance: "1.2km from you",
    guardians: 12,
    tag: "Waste",
    gradient: "from-zinc-700 to-zinc-900",
  },
  {
    id: 3,
    title: "Change Tracking",
    circle: "Eco Makers",
    location: "Langa, Cape Town",
    distance: "4km from you",
    guardians: 22,
    tag: "Monitoring",
    gradient: "from-[#005c2b] to-[#003518]",
  },
  {
    id: 4,
    title: "Tree Planting Drive",
    circle: "Green Roots",
    location: "Soweto, Johannesburg",
    distance: "8km from you",
    guardians: 55,
    tag: "Environment",
    gradient: "from-zinc-800 to-[#003518]",
  },
];

const filters = ["All", "Environment", "Waste", "Monitoring", "Education"];

export default function ChallengesPage() {
  return (
    <div className="flex flex-col min-h-full bg-surface">
      <header className="bg-white border-b border-border">
        <PageHeader
          title="Explore Challenges"
          action={
            <button className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center">
              <SlidersHorizontal size={16} className="text-text-subheading" />
            </button>
          }
        />

        <div className="flex items-center gap-1.5 px-5 mb-3">
          <MapPin size={13} className="text-gotf-green" />
          <Text variant="caption" className="font-medium text-text-subheading">
            KwaZulu-Natal · Durban
          </Text>
        </div>

        <SearchBar placeholder="Search challenges..." />
      </header>

      {/* Filter chips */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar">
        {filters.map((f, i) => (
          <button
            key={f}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium ${
              i === 0
                ? "bg-gotf-green text-white"
                : "bg-white text-text-subheading border border-border"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Challenge list */}
      <div className="flex-1 px-5 space-y-3 pb-4">
        {challenges.map((c) => (
          <a
            key={c.id}
            href={`/challenges/${c.id}`}
            className="flex items-stretch rounded-2xl overflow-hidden bg-white shadow-sm border border-border"
          >
            <div className={`w-24 shrink-0 bg-gradient-to-b ${c.gradient} relative`}>
              <span className="absolute bottom-2 left-2 bg-white/20 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">
                {c.tag}
              </span>
            </div>

            <div className="flex-1 p-3">
              <Text variant="subheading" className="font-semibold">
                {c.title}
              </Text>
              <Text variant="caption" className="text-gotf-green font-medium block mb-1.5">
                by {c.circle}
              </Text>
              <div className="flex items-center gap-1 text-text-muted mb-1">
                <MapPin size={10} />
                <Text variant="label" className="normal-case tracking-normal">
                  {c.location}
                </Text>
              </div>
              <Text variant="label" className="normal-case tracking-normal">
                {c.distance}
              </Text>
            </div>

            <div className="flex flex-col items-end justify-between p-3 shrink-0">
              <ChevronRight size={16} className="text-text-muted" />
              <div className="text-right">
                <Text variant="subheading" className="font-bold">
                  {c.guardians}
                </Text>
                <Text variant="label" className="normal-case tracking-normal">
                  Guardians
                </Text>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
