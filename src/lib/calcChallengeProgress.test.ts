import { afterEach, describe, expect, it, vi } from "vitest";

const config = vi.hoisted(() => ({
  compactDetailFields: false,
  progressRequiredStepsOnly: true,
  progressOptionalStepsBonus: true,
  canCompleteGateEnabled: false,
}));
vi.mock("../../config.json", () => ({ default: config }));

import { calcChallengeProgress } from "./utils";

const step = (required: boolean, isCompleted: boolean) => ({ required, isCompleted });
const challenge = (challengeSteps: ReturnType<typeof step>[]) => ({
  steps: 3,
  currentStep: 0,
  challengeSteps,
});

afterEach(() => {
  config.progressRequiredStepsOnly = true;
  config.progressOptionalStepsBonus = true;
});

describe("calcChallengeProgress — optional steps bonus", () => {
  it("reads 133% for 3 required + 1 optional, all done", () => {
    const p = calcChallengeProgress(
      challenge([step(true, true), step(true, true), step(false, true), step(true, true)]),
    );
    expect(p.displayPercent).toBe(133);
    // The bar's width never goes past full
    expect(p.percent).toBe(100);
    expect(p.completedCount).toBe(3);
    expect(p.total).toBe(3);
  });

  it("reads 100% when the required steps are done and the optional one isn't", () => {
    const p = calcChallengeProgress(
      challenge([step(true, true), step(true, true), step(false, false), step(true, true)]),
    );
    expect(p.displayPercent).toBe(100);
    expect(p.percent).toBe(100);
  });

  it("holds the optional step back while a required step is still open", () => {
    const p = calcChallengeProgress(
      challenge([step(true, true), step(true, true), step(false, true), step(true, false)]),
    );
    expect(p.displayPercent).toBe(67);
    expect(p.percent).toBe(67);
  });

  it("counts every completed optional step", () => {
    const p = calcChallengeProgress(
      challenge([step(true, true), step(true, true), step(false, true), step(false, true)]),
    );
    expect(p.displayPercent).toBe(200);
  });

  it("is 0 for a challenge nobody has started", () => {
    const p = calcChallengeProgress(challenge([step(true, false), step(false, false)]));
    expect(p).toMatchObject({ percent: 0, displayPercent: 0, completedCount: 0, total: 1 });
  });

  it("never exceeds 100 when no step is flagged required", () => {
    const p = calcChallengeProgress(challenge([step(false, true), step(false, true)]));
    expect(p).toMatchObject({ percent: 100, displayPercent: 100, total: 2 });
  });

  it("falls back to the step counters when there are no steps", () => {
    const p = calcChallengeProgress({ steps: 4, currentStep: 1, challengeSteps: null });
    expect(p).toMatchObject({ percent: 25, displayPercent: 25, completedCount: 1, total: 4 });
    expect(calcChallengeProgress({ steps: 0, currentStep: 0 })).toMatchObject({
      percent: 0,
      displayPercent: 0,
    });
  });
});

describe("calcChallengeProgress — flags off", () => {
  const all = challenge([step(true, true), step(true, true), step(false, true), step(true, true)]);

  it("caps at 100 with the bonus off", () => {
    config.progressOptionalStepsBonus = false;
    expect(calcChallengeProgress(all)).toMatchObject({ percent: 100, displayPercent: 100, total: 3 });
  });

  it("counts every step, with no bonus, when required-only is off", () => {
    config.progressRequiredStepsOnly = false;
    expect(calcChallengeProgress(all)).toMatchObject({ percent: 100, displayPercent: 100, total: 4 });
    const partial = challenge([step(true, true), step(true, false), step(false, true), step(true, false)]);
    expect(calcChallengeProgress(partial)).toMatchObject({ percent: 50, displayPercent: 50 });
  });
});
