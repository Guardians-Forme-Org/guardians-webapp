import { Settings, MapPin, Trophy, Leaf, Users, ChevronRight, Award, Star } from "lucide-react";
import Card from "@/components/ui/Card";
import Text from "@/components/ui/Text";

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
    <div className="flex flex-col min-h-full bg-surface">
      {/* Header */}
      <header className="bg-gotf-green px-5 pt-12 pb-8">
        <div className="flex justify-end mb-6">
          <button className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Settings size={16} className="text-white" />
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gotf-yellow flex items-center justify-center mb-3 ring-4 ring-white/20">
            <span className="text-gotf-green text-2xl font-bold">SW</span>
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
          <Text variant="label" className="block mb-3">My Impact</Text>
          <div className="grid grid-cols-2 gap-2.5">
            {impactStats.map(({ label, value }) => (
              <Card key={label} className="p-4">
                <Text variant="display" className="block">{value}</Text>
                <Text variant="caption" className="block mt-0.5">{label}</Text>
              </Card>
            ))}
          </div>
        </section>

        {/* Badges */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <Text variant="label">Badges</Text>
            <Text variant="label" className="text-gotf-green normal-case">3 / 5 earned</Text>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {badges.map(({ label, icon: Icon, earned }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 shrink-0">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                    earned
                      ? "bg-gotf-green"
                      : "bg-surface border border-dashed border-border"
                  }`}
                >
                  <Icon
                    size={22}
                    className={earned ? "text-gotf-yellow" : "text-text-muted"}
                  />
                </div>
                <Text variant="label" className={`normal-case ${earned ? "text-text-subheading" : "text-text-muted"}`}>
                  {label}
                </Text>
              </div>
            ))}
          </div>
        </section>

        {/* Recent activity */}
        <section>
          <Text variant="label" className="block mb-3">Recent Activity</Text>
          <Card className="divide-y divide-border">
            {recentActivity.map(({ text, time }) => (
              <div key={text} className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gotf-green shrink-0" />
                  <Text variant="body" className="text-text-subheading">{text}</Text>
                </div>
                <Text variant="label" className="normal-case shrink-0 ml-2">{time}</Text>
              </div>
            ))}
          </Card>
        </section>

        {/* Settings links */}
        <section>
          <Card className="divide-y divide-border">
            {["Account Settings", "Notifications", "Privacy", "Help & Feedback"].map((item) => (
              <div key={item} className="flex items-center justify-between px-4 py-3.5">
                <Text variant="body" className="text-text-subheading">{item}</Text>
                <ChevronRight size={16} className="text-text-muted" />
              </div>
            ))}
          </Card>
        </section>
      </div>
    </div>
  );
}
