"use client";

import Text from "@/components/ui/Text";
import { useState } from "react";

type ImpactStat = {
  label: string;
  value: string | number;
};

type Props = {
  badgeStats: ImpactStat[];
  activityStats: ImpactStat[];
  globalStats?: ImpactStat[];
};

function StatRow({ stats }: { stats: ImpactStat[] }) {
  return (
    <div className="flex items-center gap-10.25 px-5 py-5">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col items-center w-full">
          <Text variant="caption" className="text-text-secondary">
            {stat.label}
          </Text>
          <p className="text-[25px] font-semibold text-text-primary leading-tight mt-0.5">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function ImpactSection({ badgeStats, activityStats, globalStats }: Props) {
  const [mode, setMode] = useState<"my" | "global">("my");
  const showToggle = !!globalStats?.length;

  return (
    <section className="border-y border-progress-track">
      {/* Header + toggle */}
      <div className="flex items-center px-5 pt-5 pb-1">
        <Text variant="heading">
          {mode === "my" ? "My Impact" : "Global Impact"}
        </Text>
        {showToggle && (
          <div className="ml-auto flex bg-[#f0f0f0] rounded-full p-0.5">
            <button
              onClick={() => setMode("my")}
              className={`px-3 h-7 rounded-full text-xs font-medium transition-all ${
                mode === "my" ? "bg-white text-text-primary shadow-sm" : "text-text-muted"
              }`}
            >
              Mine
            </button>
            <button
              onClick={() => setMode("global")}
              className={`px-3 h-7 rounded-full text-xs font-medium transition-all ${
                mode === "global" ? "bg-white text-text-primary shadow-sm" : "text-text-muted"
              }`}
            >
              Global
            </button>
          </div>
        )}
      </div>

      {mode === "my" ? (
        <>
          {badgeStats.length > 0 ? (
            <StatRow stats={badgeStats} />
          ) : (
            <div className="flex items-center gap-3 px-7 py-5">
              <img
                src="/images/Guardians Logo-full.png"
                alt=""
                className="w-8 h-8 object-contain opacity-20 shrink-0"
              />
              <p className="text-sm text-text-muted">
                No impact recorded yet. Start a challenge to make your mark.
              </p>
            </div>
          )}
          <div className="mx-7.5 border-t border-progress-track" />
          <StatRow stats={activityStats} />
        </>
      ) : (
        <StatRow stats={globalStats!} />
      )}
    </section>
  );
}
