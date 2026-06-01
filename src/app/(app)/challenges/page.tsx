import { Search, MapPin, ChevronRight, SlidersHorizontal } from "lucide-react";

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

export default function ChallengesPage() {
  return (
    <div className="flex flex-col min-h-full bg-zinc-50">
      {/* Header */}
      <header className="bg-white px-5 pt-12 pb-4 border-b border-zinc-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-zinc-900">Explore Challenges</h1>
          <button className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
            <SlidersHorizontal size={16} className="text-zinc-600" />
          </button>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin size={13} className="text-[#003518]" />
          <span className="text-xs text-zinc-600 font-medium">KwaZulu-Natal · Durban</span>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-zinc-100 rounded-xl px-3 py-2.5">
          <Search size={15} className="text-zinc-400 shrink-0" />
          <span className="text-sm text-zinc-400">Search challenges...</span>
        </div>
      </header>

      {/* Filter chips */}
      <div className="flex gap-2 px-5 py-3 overflow-x-auto no-scrollbar">
        {["All", "Environment", "Waste", "Monitoring", "Education"].map((f, i) => (
          <button
            key={f}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium ${
              i === 0
                ? "bg-[#003518] text-white"
                : "bg-white text-zinc-600 border border-zinc-200"
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
            className="flex items-stretch rounded-2xl overflow-hidden bg-white shadow-sm border border-zinc-100"
          >
            {/* Color strip / image placeholder */}
            <div className={`w-24 shrink-0 bg-gradient-to-b ${c.gradient} relative`}>
              <span className="absolute bottom-2 left-2 bg-white/20 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">
                {c.tag}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 p-3">
              <p className="font-semibold text-sm text-zinc-900">{c.title}</p>
              <p className="text-xs text-[#003518] font-medium mb-1.5">by {c.circle}</p>
              <div className="flex items-center gap-1 text-zinc-400 mb-1">
                <MapPin size={10} />
                <span className="text-[10px]">{c.location}</span>
              </div>
              <p className="text-[10px] text-zinc-400">{c.distance}</p>
            </div>

            {/* Right side */}
            <div className="flex flex-col items-end justify-between p-3 shrink-0">
              <ChevronRight size={16} className="text-zinc-300" />
              <div className="text-right">
                <p className="text-xs font-bold text-zinc-900">{c.guardians}</p>
                <p className="text-[9px] text-zinc-400">Guardians</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
