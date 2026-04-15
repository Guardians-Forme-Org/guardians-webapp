"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type {
  ActiveFilters,
  ChallengeTimeCommitment,
  ChallengeTeamSize,
} from "@/types/challenges";

type Props = {
  filters: ActiveFilters;
  onChange: (filters: ActiveFilters) => void;
};

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium border transition-all",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

const TIME_OPTIONS: ChallengeTimeCommitment[] = [
  "half_day",
  "full_day",
  "multi_day",
  "multi_week",
  "ongoing",
];

const TEAM_OPTIONS: ChallengeTeamSize[] = [
  "individual",
  "small",
  "circle",
  "large",
];

const LEVEL_OPTIONS = ["L1", "L2", "L3"] as const;

export function ChallengeFilterBar({ filters, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2.5">
      <FilterRow label={t("challenges.filters.time")}>
        {TIME_OPTIONS.map((opt) => (
          <Pill
            key={opt}
            active={filters.time.includes(opt)}
            onClick={() =>
              onChange({ ...filters, time: toggleItem(filters.time, opt) })
            }
          >
            {t(`challenges.filters.${opt}`)}
          </Pill>
        ))}
      </FilterRow>

      <FilterRow label={t("challenges.filters.team")}>
        {TEAM_OPTIONS.map((opt) => (
          <Pill
            key={opt}
            active={filters.team.includes(opt)}
            onClick={() =>
              onChange({ ...filters, team: toggleItem(filters.team, opt) })
            }
          >
            {t(`challenges.filters.${opt}`)}
          </Pill>
        ))}
      </FilterRow>

      <FilterRow label={t("challenges.filters.level")}>
        {LEVEL_OPTIONS.map((opt) => (
          <Pill
            key={opt}
            active={filters.validation.includes(opt)}
            onClick={() =>
              onChange({
                ...filters,
                validation: toggleItem(filters.validation, opt),
              })
            }
          >
            {opt}
          </Pill>
        ))}
      </FilterRow>
    </div>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground/60 w-12 shrink-0">
        {label}
      </span>
      {children}
    </div>
  );
}
