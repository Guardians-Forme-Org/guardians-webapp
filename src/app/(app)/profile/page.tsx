import { Settings, MapPin, Trophy, Leaf, Users, ChevronRight, Award, Star } from "lucide-react";

const impactStats = [
  { label: "kg composted", value: "32" },
  { label: "trees planted", value: "8" },
  { label: "m² greened", value: "750" },
  { label: "CO₂ avoided", value: "1.8t" },
];

const badges = [
  { label: "First Step", icon: Star, earned: true },
  { label: "Circle Maker", icon: Users, earned: true },
  { label: "Green Thumb", icon: Leaf, earned: true },
  { label: "Champion", icon: Trophy, earned: false },
  { label: "Top Guardian", icon: Award, earned: false },
];

const recentActivity = [
  { text: "Logged 5 kg compost in Waste Compost", time: "2 hours ago" },
  { text: "Joined Re-Greening challenge", time: "Yesterday" },
  { text: "Completed Step 1 of Change Tracking", time: "3 days ago" },
];

export default function ProfilePage() {
  return (
    <div className="flex flex-col min-h-full bg-zinc-50">
      {/* Header */}
      <header className="bg-[#003518] px-5 pt-12 pb-8">
        <div className="flex justify-end mb-6">
          <button className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Settings size={16} className="text-white" />
          </button>
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gotf-yellow flex items-center justify-center mb-3 ring-4 ring-white/20">
            <span className="text-[#003518] text-2xl font-bold">SW</span>
          </div>
          <h1 className="text-white text-xl font-bold">Sean Wilson</h1>
          <p className="text-green-300 text-xs mt-0.5">Facilitator</p>
          <div className="flex items-center gap-1 mt-1.5">
            <MapPin size={11} className="text-green-300" />
            <span className="text-green-300 text-xs">KwaZulu-Natal, Durban</span>
          </div>
        </div>
      </header>

      <div className="flex-1 px-5 py-5 space-y-6">
        {/* Impact stats */}
        <section>
          <h2 className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">
            My Impact
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {impactStats.map(({ label, value }) => (
              <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
                <p className="text-2xl font-bold text-zinc-900">{value}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Badges */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
              Badges
            </h2>
            <span className="text-xs text-[#003518] font-medium">3 / 5 earned</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {badges.map(({ label, icon: Icon, earned }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    earned
                      ? "bg-[#003518]"
                      : "bg-zinc-100 border border-dashed border-zinc-300"
                  }`}
                >
                  <Icon
                    size={22}
                    className={earned ? "text-gotf-yellow" : "text-zinc-300"}
                  />
                </div>
                <span className={`text-[10px] font-medium ${earned ? "text-zinc-700" : "text-zinc-400"}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Recent activity */}
        <section>
          <h2 className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-3">
            Recent Activity
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 divide-y divide-zinc-50">
            {recentActivity.map(({ text, time }) => (
              <div key={text} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#003518] shrink-0" />
                  <p className="text-sm text-zinc-700">{text}</p>
                </div>
                <span className="text-[10px] text-zinc-400 shrink-0 ml-2">{time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Settings links */}
        <section>
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 divide-y divide-zinc-50">
            {["Account Settings", "Notifications", "Privacy", "Help & Feedback"].map((item) => (
              <div key={item} className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm text-zinc-700">{item}</span>
                <ChevronRight size={16} className="text-zinc-300" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
