import Text from "@/components/ui/Text";

type ImpactStat = {
  label: string;
  value: string;
};

type Props = {
  badgeStats: ImpactStat[];
  activityStats: ImpactStat[];
};

function StatRow({ stats }: { stats: ImpactStat[] }) {
  return (
    <div className="flex items-center gap-10.25 px-5 py-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center w-20 shrink-0"
        >
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

export default function ImpactSection({ badgeStats, activityStats }: Props) {
  return (
    <section className="border-y border-progress-track">
      <Text variant="heading" className="block px-5 pt-5">
        My impact
      </Text>
      <StatRow stats={badgeStats} />
      <div className="mx-7.5 border-t border-progress-track" />
      <StatRow stats={activityStats} />
    </section>
  );
}
