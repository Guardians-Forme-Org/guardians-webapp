import appConfig from "../../config.json";

export function deriveImpactLabel(shortSummary: string): string {
  const withUnitOf = shortSummary.replace(/^[\d,.]+ \S+ of /i, "");
  if (withUnitOf !== shortSummary) {
    return withUnitOf.charAt(0).toUpperCase() + withUnitOf.slice(1);
  }
  const numberOnly = shortSummary.replace(/^[\d,.]+ /, "");
  return numberOnly.charAt(0).toUpperCase() + numberOnly.slice(1);
}

// BE sends description/slug per impact only on some write paths — the
// volunteer-hours recalculation (BE 2026-08-08) sets slug but not
// description; older records may have neither and fall back to the
// derived label.
export function getImpactTileLabel(item: {
  impact?: {
    shortSummary?: string;
    summary?: string;
    description?: string;
    slug?: string;
  } | null;
}): string {
  if (item.impact?.description) return item.impact.description;
  if (item.impact?.slug) return item.impact.slug;
  return deriveImpactLabel(item.impact?.shortSummary ?? item.impact?.summary ?? "");
}

export function formatImpactDisplayValue(displayName: string): string {
  return displayName
    .replace(/^([\d.]+)/, (_, n) => {
      const rounded = Math.round(parseFloat(n) * 10) / 10;
      return rounded % 1 === 0 ? String(Math.round(rounded)) : String(rounded);
    })
    .replace(/\bIncidents\b/, "incidents");
}

// displayName is `omitzero` on the BE Measurement struct — some write paths
// (e.g. the volunteer-hours recalculation, BE 2026-08-08) never set it, only
// value/unitOfMeasure/summary. Fall back to building "{value} {unit}" so the
// tile isn't silently blank.
export function formatImpactMetricValue(metric?: {
  value?: number;
  unitOfMeasure?: string;
  displayName?: string;
} | null): string {
  const raw =
    metric?.displayName ??
    (metric?.value != null ? `${metric.value} ${metric.unitOfMeasure ?? ""}`.trim() : "");
  return formatImpactDisplayValue(raw);
}

export function calcChallengeProgress(challenge: {
  steps: number;
  currentStep: number;
  challengeSteps?: Array<{ isCompleted: boolean; required?: boolean }> | null;
}): { percent: number; completedCount: number } {
  const steps = challenge.challengeSteps;
  // Toggle in config.json — flip off if required-only progress needs to be
  // compared against the old all-steps behavior.
  const hasRequiredSteps =
    appConfig.progressRequiredStepsOnly && !!steps?.some((s) => s.required === true);
  const countedSteps = hasRequiredSteps ? steps!.filter((s) => s.required === true) : steps;
  const total = countedSteps?.length ? countedSteps.length : challenge.steps;
  if (total <= 0) return { percent: 0, completedCount: 0 };
  const completedCount = countedSteps?.length
    ? countedSteps.filter((s) => s.isCompleted).length
    : challenge.currentStep;
  return {
    percent: Math.min(100, Math.round((completedCount / total) * 100)),
    completedCount,
  };
}
