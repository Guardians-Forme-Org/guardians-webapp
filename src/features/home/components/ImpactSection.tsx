import Text from "@/components/ui/Text";

type ImpactStat = {
  label: string;
  value: string;
};

type ImpactRowProps = {
  icon: React.ReactNode;
  rowLabel: string;
  stats: ImpactStat[];
};

function ImpactRow({ icon, rowLabel, stats }: ImpactRowProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 ">
      <div className="flex items-center gap-1.5 w-full shrink-0">
        {/* <span className="text-[8px]">{icon}</span> */}
        <Text variant="caption" className="text-black font-semibold">
          {rowLabel}
        </Text>
      </div>
      <div className="flex flex-1 w-full">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex-1 px-3 first:pl-0 justify-center flex flex-col items-center gap-5"
          >
            <Text variant="caption" className="block leading-0">
              {stat.label}
            </Text>
            <Text
              variant="display"
              className="block font-bold text-[#0A0A0A] text-lg leading-0"
            >
              {stat.value}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  badgeStats: ImpactStat[];
  activityStats: ImpactStat[];
};

export default function ImpactSection({ badgeStats, activityStats }: Props) {
  return (
    <section className="mx-5 mb-6 border-y border-gray-700/10 py-5 -mt-2">
      <Text variant="heading" className="block mb-1 font-bold">
        My impact
      </Text>
      <div className="divide-y divide-[#EBEBEB]">
        <ImpactRow
          rowLabel="Badges"
          icon={
            <span className="text-sm" role="img" aria-label="badges">
              🔥
            </span>
          }
          stats={badgeStats}
        />
        <ImpactRow
          rowLabel="Activity"
          icon={
            <span className="text-sm" role="img" aria-label="activity">
              🟢
            </span>
          }
          stats={activityStats}
        />
      </div>
    </section>
  );
}
