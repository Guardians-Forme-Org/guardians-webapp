export function isCrimeIncidentImpact(item: {
  siUnit?: string;
  impactType?: string;
  impactSummary?: { impact?: { unitOfMeasure?: string; shortSummary?: string } };
}): boolean {
  const lower = (s?: string) => (s ?? "").toLowerCase();
  return (
    lower(item.siUnit).includes("incident") ||
    lower(item.siUnit).includes("crime") ||
    lower(item.impactType).includes("crime") ||
    lower(item.impactSummary?.impact?.unitOfMeasure).includes("incident") ||
    lower(item.impactSummary?.impact?.shortSummary).includes("crime")
  );
}

export function deriveImpactLabel(shortSummary: string): string {
  const withUnitOf = shortSummary.replace(/^[\d,.]+ \S+ of /i, "");
  if (withUnitOf !== shortSummary) {
    return withUnitOf.charAt(0).toUpperCase() + withUnitOf.slice(1);
  }
  const numberOnly = shortSummary.replace(/^[\d,.]+ /, "");
  return numberOnly.charAt(0).toUpperCase() + numberOnly.slice(1);
}

export function formatImpactDisplayValue(displayName: string): string {
  return displayName
    .replace(/^([\d.]+)/, (_, n) => {
      const rounded = Math.round(parseFloat(n) * 10) / 10;
      return rounded % 1 === 0 ? String(Math.round(rounded)) : String(rounded);
    })
    .replace(/\bIncidents\b/, "incidents");
}

export function calcChallengeProgress(challenge: {
  steps: number;
  currentStep: number;
  challengeSteps?: Array<{ isCompleted: boolean }> | null;
}): { percent: number; completedCount: number } {
  if (challenge.steps <= 0) return { percent: 0, completedCount: 0 };
  const steps = challenge.challengeSteps;
  const completedCount = steps?.length
    ? steps.filter((s) => s.isCompleted).length
    : challenge.currentStep;
  return {
    percent: Math.round((completedCount / challenge.steps) * 100),
    completedCount,
  };
}
