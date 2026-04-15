"use client";

import { useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useChallenges } from "@/hooks/useChallenges";
import { filterChallenges } from "@/lib/filterChallenges";
import { ChallengeDomainTabs } from "@/components/challenges/ChallengeDomainTabs";
import { ChallengeFilterBar } from "@/components/challenges/ChallengeFilterBar";
import { ChallengeGrid } from "@/components/challenges/ChallengeGrid";
import { GuidedFinder } from "@/components/challenges/GuidedFinder";
import type {
  ActiveFilters,
  ChallengeDomain,
  ChallengeTeamSize,
  ChallengeTimeCommitment,
  TaggedChallenge,
} from "@/types/challenges";

function parseParam<T extends string>(
  value: string | null,
  valid: readonly T[],
): T[] {
  if (!value) return [];
  return value.split(",").filter((v): v is T => valid.includes(v as T));
}

const DOMAINS: ChallengeDomain[] = [
  "mitigation",
  "resilience",
  "democratic_infrastructure",
  "regeneration",
];
const TIMES: ChallengeTimeCommitment[] = [
  "half_day",
  "full_day",
  "multi_day",
  "multi_week",
  "ongoing",
];
const TEAMS: ChallengeTeamSize[] = ["individual", "small", "circle", "large"];
const LEVELS = ["L1", "L2", "L3"] as const;

function filtersToParams(filters: ActiveFilters): string {
  const p = new URLSearchParams();
  if (filters.domains.length) p.set("domains", filters.domains.join(","));
  if (filters.time.length) p.set("time", filters.time.join(","));
  if (filters.team.length) p.set("team", filters.team.join(","));
  if (filters.validation.length) p.set("validation", filters.validation.join(","));
  const s = p.toString();
  return s ? `?${s}` : "";
}

function hasActiveFilters(filters: ActiveFilters): boolean {
  return (
    filters.domains.length > 0 ||
    filters.time.length > 0 ||
    filters.team.length > 0 ||
    filters.validation.length > 0
  );
}

function ChallengesContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters: ActiveFilters = {
    domains: parseParam(searchParams.get("domains"), DOMAINS),
    time: parseParam(searchParams.get("time"), TIMES),
    team: parseParam(searchParams.get("team"), TEAMS),
    validation: parseParam(searchParams.get("validation"), LEVELS),
  };

  const [finderOpen, setFinderOpen] = useState(false);

  const { data: raw, isLoading, isError } = useChallenges();
  const challenges: TaggedChallenge[] = (raw as unknown as TaggedChallenge[]) ?? [];

  const filtered = useMemo(
    () => filterChallenges(challenges, filters),
    [challenges, filters],
  );

  function setFilters(next: ActiveFilters) {
    router.replace(`/challenges${filtersToParams(next)}`);
  }

  function clearFilters() {
    router.replace("/challenges");
  }

  const active = hasActiveFilters(filters);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("challenges.library.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("challenges.library.subtitle")}
          </p>
        </div>
        <button
          onClick={() => setFinderOpen(true)}
          className="shrink-0 mt-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors whitespace-nowrap"
        >
          {t("challenges.library.finder_cta")} →
        </button>
      </div>

      {isError && (
        <p className="text-sm text-destructive">{t("challenges.list.errorTitle")}</p>
      )}

      {/* Domain tabs */}
      <ChallengeDomainTabs
        active={filters.domains}
        onChange={(domains) => setFilters({ ...filters, domains })}
      />

      {/* Secondary filters */}
      <ChallengeFilterBar filters={filters} onChange={setFilters} />

      {/* Result count + clear */}
      <div className="flex items-center justify-between">
        {!isLoading && (
          <p className="text-xs text-muted-foreground">
            {t("challenges.library.showing", { count: filtered.length })}
          </p>
        )}
        {active && (
          <button
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            {t("challenges.library.empty_cta")}
          </button>
        )}
      </div>

      {/* Grid */}
      <ChallengeGrid
        challenges={filtered}
        isLoading={isLoading}
        onClearFilters={clearFilters}
      />

      {/* Guided finder panel */}
      <GuidedFinder
        open={finderOpen}
        onClose={() => setFinderOpen(false)}
        challenges={challenges}
      />
    </div>
  );
}

export default function ChallengesPage() {
  return (
    <Suspense>
      <ChallengesContent />
    </Suspense>
  );
}
