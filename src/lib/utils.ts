export function calcChallengeProgress(challenge: {
  steps: number;
  currentStep: number;
  challengeSteps?: Array<{ completed?: boolean }> | null;
}): { percent: number; completedCount: number } {
  if (challenge.steps <= 0) return { percent: 0, completedCount: 0 };
  const steps = challenge.challengeSteps;
  const completedCount = steps?.length
    ? steps.filter((s) => s.completed).length
    : challenge.currentStep;
  return {
    percent: Math.round((completedCount / challenge.steps) * 100),
    completedCount,
  };
}
