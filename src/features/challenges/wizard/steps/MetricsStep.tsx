"use client";

import { useTranslations } from "next-intl";
import { MetricCard, SaveButton } from "../shared";

type Props = {
  onNext: () => void;
  nextLabel: string;
};

export default function MetricsStep({ onNext, nextLabel }: Props) {
  const t = useTranslations("challenges");

  return (
    <>
      <div className="px-5 mt-7 mb-2">
        <h1 className="text-[32px] font-bold text-black">{t("progress")}</h1>
        <p className="text-[18px] text-black mt-2">{t("readOnly")}</p>
      </div>

      <div className="flex flex-col gap-3 px-5 mt-5">
        <MetricCard
          label={t("heatMitigationLabel")}
          value="3.2"
          unit={t("heatMitigationUnit")}
          status={t("heatMitigationStatus")}
          statusColor="amber"
          link={t("howCalculated")}
        />
        <MetricCard
          label={t("stormwaterLabel")}
          value="12,400"
          unit={t("stormwaterUnit")}
          status={t("stormwaterStatus")}
          statusColor="green"
          link={t("viewMethodology")}
        />
      </div>

      <div className="flex-1" />
      <SaveButton label={nextLabel} onClick={onNext} />
    </>
  );
}
