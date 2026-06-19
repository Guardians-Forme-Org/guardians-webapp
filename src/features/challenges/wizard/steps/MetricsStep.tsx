import { MetricCard, SaveButton } from "../shared";

type Props = {
  onNext: () => void;
  nextLabel: string;
};

export default function MetricsStep({ onNext, nextLabel }: Props) {
  return (
    <>
      <div className="px-5 mt-7 mb-2">
        <h1 className="text-[32px] font-bold text-black">Progress</h1>
        <p className="text-[18px] text-black mt-2">Read Only</p>
      </div>

      <div className="flex flex-col gap-3 px-5 mt-5">
        <MetricCard
          label="Heat mitigation proxy"
          value="3.2"
          unit="°C estimated surface cooling"
          status="Pending review"
          statusColor="amber"
          link="How is this calculated?"
        />
        <MetricCard
          label="Annual stormwater absorption"
          value="12,400"
          unit="litres / year"
          status="Calculated"
          statusColor="green"
          link="View methodology"
        />
      </div>

      <div className="flex-1" />
      <SaveButton label={nextLabel} onClick={onNext} />
    </>
  );
}
