"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ALL_DOMAINS } from "@/lib/challengeDomains";
import type { ChallengeDomain } from "@/types/challenges";

type Props = {
  active: ChallengeDomain[];
  onChange: (domains: ChallengeDomain[]) => void;
};

export function ChallengeDomainTabs({ active, onChange }: Props) {
  const { t } = useTranslation();
  const isAll = active.length === 0;

  function handleClick(key: ChallengeDomain | "all") {
    if (key === "all") {
      onChange([]);
    } else {
      onChange([key]);
    }
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {ALL_DOMAINS.map((domain) => {
        const isActive =
          domain.key === "all"
            ? isAll
            : active.includes(domain.key as ChallengeDomain);

        return (
          <button
            key={domain.key}
            onClick={() => handleClick(domain.key as ChallengeDomain | "all")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all",
              isActive
                ? domain.key === "all"
                  ? "bg-foreground text-background border-foreground"
                  : cn(domain.bgClass, domain.textClass, domain.borderClass)
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground",
            )}
          >
            {t(domain.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
