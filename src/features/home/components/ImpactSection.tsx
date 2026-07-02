"use client";

import Skeleton from "@/components/ui/Skeleton";
import Text from "@/components/ui/Text";
import type { ImpactMatrixItem, ThingsMatrixItem } from "@/lib/hooks/metrics";
import { deriveImpactLabel, formatImpactDisplayValue, isContributionOnlyImpact } from "@/lib/utils";
import { useState } from "react";
import { useTranslations } from "next-intl";

type PersonalStat = {
  label: string;
  value: string | number;
};

type Props = {
  badgeStats: PersonalStat[];
  activityStats: PersonalStat[];
  impactMatrix?: ImpactMatrixItem[];
  thingsMatrix?: ThingsMatrixItem[];
  mode?: "my" | "global";
  isLoading?: boolean;
};

function ImpactGrid({ items }: { items: ImpactMatrixItem[] }) {
  return (
    <div className="grid grid-cols-3 gap-x-2 gap-y-5 px-5 py-5">
      {items.map((item) => {
        const contributionOnly = isContributionOnlyImpact(item);
        const label = contributionOnly
          ? item.impactSummary.contribution.unitOfMeasure
          : deriveImpactLabel(item.impactSummary.impact.shortSummary);
        const value = contributionOnly
          ? formatImpactDisplayValue(item.impactSummary.contribution.displayName)
          : formatImpactDisplayValue(item.impactSummary.impact.displayName);
        return (
          <div key={item.id} className="flex flex-col items-center">
            <Text variant="caption" className="text-text-secondary leading-tight text-center text-balance">
              {label}
            </Text>
            <p className="text-[22px] font-semibold text-text-primary leading-tight mt-0.5">
              {value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function MadeByRow({ items }: { items: ThingsMatrixItem[] }) {
  const t = useTranslations("home");
  const displayItems = items.map((item) => ({
    ...item,
    displayName: item.name === "Users" ? t("guardians") : item.name,
  }));

  return (
    <div>
      <Text variant="caption" className="text-text-muted px-5 pb-1">
        {t("madeBy")}
      </Text>
      <div className="flex items-center px-5 pb-5">
        {displayItems.map((item) => (
          <div key={item.name} className="flex flex-col items-center w-full">
            <Text variant="caption" className="text-text-secondary">
              {item.displayName}
            </Text>
            <p className="text-[25px] font-semibold text-text-primary leading-tight mt-0.5">
              {item.displayValue}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PersonalStatRow({ stats }: { stats: PersonalStat[] }) {
  return (
    <div className="flex items-center gap-10 px-5 py-5">
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

export default function ImpactSection({
  badgeStats,
  activityStats,
  impactMatrix,
  thingsMatrix,
  mode: modeProp,
  isLoading,
}: Props) {
  const t = useTranslations("home");
  const hasGlobal = !!(impactMatrix?.length || thingsMatrix?.length);
  const [internalMode, setInternalMode] = useState<"my" | "global">(hasGlobal ? "global" : "my");
  const mode = modeProp ?? internalMode;
  const showToggle = !modeProp && hasGlobal;

  return (
    <section className="border-y border-progress-track">
      <div className="flex items-center px-5 pt-5 pb-1">
        <Text variant="heading">
          {mode === "my" ? t("myImpactHeading") : t("globalImpactHeading")}
        </Text>
        {showToggle && (
          <div className="ml-auto flex bg-[#f0f0f0] rounded-full p-0.5">
            <button
              onClick={() => setInternalMode("my")}
              className={`px-3 h-7 rounded-full text-xs font-medium transition-all ${
                internalMode === "my" ? "bg-white text-text-primary shadow-sm" : "text-text-muted"
              }`}
            >
              {t("mine")}
            </button>
            <button
              onClick={() => setInternalMode("global")}
              className={`px-3 h-7 rounded-full text-xs font-medium transition-all ${
                internalMode === "global" ? "bg-white text-text-primary shadow-sm" : "text-text-muted"
              }`}
            >
              {t("global")}
            </button>
          </div>
        )}
      </div>

      {mode === "global" ? (
        <>
          {isLoading ? (
            <div className="grid grid-cols-3 gap-x-2 gap-y-5 px-5 py-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-6 w-10" />
                </div>
              ))}
            </div>
          ) : impactMatrix && impactMatrix.length > 0 ? (
            <div className="fade-up"><ImpactGrid items={impactMatrix} /></div>
          ) : (
            <div className="px-5 py-5">
              <p className="text-sm text-text-muted">{t("noGlobalImpact")}</p>
            </div>
          )}
          {thingsMatrix && thingsMatrix.length > 0 && (
            <div className="fade-up">
              <div className="mx-5 border-t border-progress-track" />
              <MadeByRow items={thingsMatrix} />
            </div>
          )}
        </>
      ) : (
        <>
          {badgeStats.length > 0 ? (
            <PersonalStatRow stats={badgeStats} />
          ) : (
            <div className="flex items-center gap-3 px-7 py-5">
              <img
                src="/images/Guardians Logo-full.png"
                alt=""
                className="w-8 h-8 object-contain opacity-20 shrink-0"
              />
              <p className="text-sm text-text-muted">
                {t("noPersonalImpact")}
              </p>
            </div>
          )}
          <div className="mx-5 border-t border-progress-track" />
          <PersonalStatRow stats={activityStats} />
        </>
      )}
    </section>
  );
}
