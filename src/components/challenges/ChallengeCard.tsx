"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { getDomainConfig } from "@/lib/challengeDomains";
import type { TaggedChallenge } from "@/types/challenges";

type Props = {
  challenge: TaggedChallenge;
};

export function ChallengeCard({ challenge }: Props) {
  const { t } = useTranslation();
  const primaryDomain = challenge.tags?.domain?.[0];
  const domainCfg = primaryDomain ? getDomainConfig(primaryDomain) : null;

  return (
    <Link href={`/challenges/${challenge.id}`} className="group block h-full">
      <div
        className={cn(
          "flex flex-col h-full rounded-xl border bg-card overflow-hidden",
          "transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-px",
          domainCfg ? domainCfg.borderClass : "border-border",
        )}
      >
        {/* Domain colour bar */}
        <div className={cn("h-1 w-full shrink-0", domainCfg?.bgClass ?? "bg-muted")} />

        <div className="flex flex-col flex-1 p-4 gap-3">
          {/* Domain + validation badges */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {challenge.tags?.domain.map((d) => {
                const cfg = getDomainConfig(d);
                return (
                  <span
                    key={d}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide border",
                      cfg.bgClass,
                      cfg.textClass,
                      cfg.borderClass,
                    )}
                  >
                    {t(cfg.labelKey)}
                  </span>
                );
              })}
              {!challenge.tags && challenge.category && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide border bg-muted text-muted-foreground border-border">
                  {challenge.category.name}
                </span>
              )}
            </div>
            <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
              {challenge.tags?.validation ??
                (challenge.validation_tier
                  ? `L${challenge.validation_tier.level}`
                  : null)}
            </span>
          </div>

          {/* Title + description */}
          <div className="flex-1 space-y-1.5">
            <p className="text-sm font-semibold leading-snug tracking-tight line-clamp-2">
              {challenge.title}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {challenge.description}
            </p>
          </div>

          {/* Region */}
          {challenge.region && (
            <p className="text-[11px] text-muted-foreground/60">
              {challenge.region.suburb}, {challenge.region.city}
            </p>
          )}

          {/* Tag strip */}
          {challenge.tags && (
            <div className="pt-2.5 border-t border-border/60 flex flex-wrap gap-1">
              {challenge.tags.time && (
                <Chip>{t(`challenges.filters.${challenge.tags.time}`)}</Chip>
              )}
              {challenge.tags.team && (
                <Chip>{t(`challenges.filters.${challenge.tags.team}`)}</Chip>
              )}
              {challenge.tags.resources && (
                <Chip>
                  {challenge.tags.resources.charAt(0).toUpperCase() +
                    challenge.tags.resources.slice(1)}{" "}
                  resources
                </Chip>
              )}
              {challenge.tags.setting && challenge.tags.setting !== "both" && (
                <Chip>
                  {challenge.tags.setting.charAt(0).toUpperCase() +
                    challenge.tags.setting.slice(1)}
                </Chip>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
      {children}
    </span>
  );
}
