import { Bell, MapPin, ChevronRight, Leaf, Users, Trophy } from "lucide-react";

const activeChallenges = [
  {
    id: 1,
    title: "Re-Greening",
    circle: "Urban Greening",
    location: "KwaZulu-Natal, Durban",
    step: "Step 2 of 4",
    progress: 60,
    image: "/images/challenge-regreen.jpg",
    guardians: 38,
  },
  {
    id: 2,
    title: "Waste Compost",
    circle: "Urban Watch",
    location: "Umoja 1, Nairobi",
    step: "Step 1 of 3",
    progress: 25,
    image: "/images/challenge-waste.jpg",
    guardians: 12,
  },
];

const stats = [
  { label: "Impact Points", value: "2,340", icon: Leaf },
  { label: "Circles", value: "3", icon: Users },
  { label: "Challenges", value: "5", icon: Trophy },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-full bg-zinc-50">
      {/* Header */}
      <header className="bg-[#003518] px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-green-300 text-xs font-medium tracking-widest uppercase">
              Welcome back
            </p>
            <h1 className="text-white text-2xl font-semibold mt-0.5">Guardian</h1>
          </div>
          <button className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Bell size={18} className="text-white" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#e9ce2c]" />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/10 rounded-xl p-3">
              <Icon size={16} className="text-green-300 mb-1" />
              <p className="text-white text-lg font-bold leading-none">{value}</p>
              <p className="text-green-300 text-[10px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="flex-1 px-5 py-5 space-y-6">
        {/* Active Challenges */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-zinc-900 font-semibold text-base">Your Challenges</h2>
            <a href="/challenges" className="text-xs text-[#003518] font-medium flex items-center gap-0.5">
              See all <ChevronRight size={14} />
            </a>
          </div>

          <div className="space-y-3">
            {activeChallenges.map((c) => (
              <a
                key={c.id}
                href={`/challenges/${c.id}`}
                className="block rounded-2xl overflow-hidden bg-white shadow-sm border border-zinc-100"
              >
                <div
                  className="h-28 bg-zinc-300 relative"
                  style={{ background: `linear-gradient(135deg, #003518 0%, #005c2b 100%)` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-semibold text-sm">{c.title}</p>
                    <p className="text-white/70 text-xs">by {c.circle}</p>
                  </div>
                  <span className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                    {c.step}
                  </span>
                </div>
                <div className="px-3 py-2.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1 text-zinc-500">
                      <MapPin size={11} />
                      <span className="text-[11px]">{c.location}</span>
                    </div>
                    <span className="text-[11px] text-zinc-500">{c.guardians} guardians</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-400 rounded-full"
                      style={{ width: `${c.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 text-right">{c.progress}% complete</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="text-zinc-900 font-semibold text-base mb-3">Explore</h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/challenges"
              className="flex flex-col gap-1.5 bg-[#003518] text-white rounded-2xl p-4"
            >
              <Trophy size={20} className="text-[#e9ce2c]" />
              <p className="font-semibold text-sm">Find Challenges</p>
              <p className="text-green-300 text-[11px]">Join community action</p>
            </a>
            <a
              href="/circles"
              className="flex flex-col gap-1.5 bg-[#e9ce2c] text-zinc-900 rounded-2xl p-4"
            >
              <Users size={20} className="text-[#003518]" />
              <p className="font-semibold text-sm">Join a Circle</p>
              <p className="text-zinc-600 text-[11px]">Organise with others</p>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
