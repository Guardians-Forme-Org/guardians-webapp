import { Search, MapPin, Plus, ChevronRight, Users } from "lucide-react";

const myCircles = [
  {
    id: 1,
    name: "Urban Greening",
    location: "KwaZulu-Natal, Durban",
    members: 24,
    challenges: 3,
    role: "Member",
    color: "#003518",
  },
  {
    id: 2,
    name: "Urban Watch",
    location: "Umoja 1, Nairobi",
    members: 12,
    challenges: 1,
    role: "Facilitator",
    color: "#1a4a2e",
  },
];

const exploreCircles = [
  {
    id: 3,
    name: "Eco Makers",
    location: "Langa, Cape Town",
    members: 34,
    challenges: 5,
    color: "#2d6a4f",
  },
  {
    id: 4,
    name: "Green Roots",
    location: "Soweto, Johannesburg",
    members: 67,
    challenges: 8,
    color: "#003518",
  },
  {
    id: 5,
    name: "River Keepers",
    location: "Gaborone, Botswana",
    members: 18,
    challenges: 2,
    color: "#1a4a2e",
  },
];

export default function CirclesPage() {
  return (
    <div className="flex flex-col min-h-full bg-zinc-50">
      {/* Header */}
      <header className="bg-white px-5 pt-12 pb-4 border-b border-zinc-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-zinc-900">Circles</h1>
          <button className="flex items-center gap-1.5 bg-[#003518] text-white text-xs font-medium px-3 py-2 rounded-xl">
            <Plus size={13} />
            Create
          </button>
        </div>

        <div className="flex items-center gap-2 bg-zinc-100 rounded-xl px-3 py-2.5">
          <Search size={15} className="text-zinc-400 shrink-0" />
          <span className="text-sm text-zinc-400">Search circles...</span>
        </div>
      </header>

      <div className="flex-1 px-5 py-5 space-y-6">
        {/* My Circles */}
        <section>
          <h2 className="text-zinc-900 font-semibold text-sm mb-3 uppercase tracking-wider text-xs text-zinc-500">
            My Circles
          </h2>
          <div className="space-y-2.5">
            {myCircles.map((c) => (
              <a
                key={c.id}
                href={`/circles/${c.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-zinc-100"
              >
                {/* Avatar */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: c.color }}
                >
                  <Users size={20} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-zinc-900 truncate">{c.name}</p>
                    <span className="shrink-0 text-[10px] font-medium text-[#003518] bg-green-50 px-2 py-0.5 rounded-full">
                      {c.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-zinc-400 mt-0.5">
                    <MapPin size={10} />
                    <span className="text-[11px] truncate">{c.location}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {c.members} members · {c.challenges} challenges
                  </p>
                </div>

                <ChevronRight size={16} className="text-zinc-300 shrink-0" />
              </a>
            ))}
          </div>
        </section>

        {/* Explore */}
        <section>
          <h2 className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">
            Explore Near You
          </h2>
          <div className="space-y-2.5">
            {exploreCircles.map((c) => (
              <a
                key={c.id}
                href={`/circles/${c.id}`}
                className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-zinc-100"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: c.color }}
                >
                  <Users size={20} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-zinc-900 truncate">{c.name}</p>
                  <div className="flex items-center gap-1 text-zinc-400 mt-0.5">
                    <MapPin size={10} />
                    <span className="text-[11px] truncate">{c.location}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {c.members} members · {c.challenges} challenges
                  </p>
                </div>

                <button className="shrink-0 text-[11px] font-semibold text-[#003518] border border-[#003518] px-2.5 py-1 rounded-lg">
                  Join
                </button>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
