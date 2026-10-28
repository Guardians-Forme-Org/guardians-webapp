import { describe, expect, it } from "vitest";
import type { ApiTemplateFormField } from "@/lib/types/challenges";
import { deriveWizardConfig, withLinkedChallengeOptions } from "./deriveWizardConfig";

const field = (
  name: string,
  type: ApiTemplateFormField["type"],
  extra: Partial<ApiTemplateFormField> = {},
): ApiTemplateFormField => ({ name, label: name, type, required: true, displayOrder: 0, ...extra });

// CH-002 step 1 as the template ships it (fields trimmed)
const step1 = [
  field("region", "LOCATION", { displayOrder: 1 }),
  field("anchorPoint", "GROUP", {
    displayOrder: 2,
    addableInput: true,
    fields: [field("name", "TEXT", { displayOrder: 1 }), field("location", "LOCATION", { displayOrder: 2 })],
  }),
  field("linkedChallenge", "SELECT", { displayOrder: 3, required: false, options: [] }),
  field("volunteerHours", "NUMERIC", { displayOrder: 4 }),
  field("contributors", "TEXT", { displayOrder: 5 }),
];

const circleChallenges = [
  { challengeId: "OWN0001", name: "Schoolyard time-lapse" },
  { challengeId: "EF55B3E", name: "Compost Sprint" },
  { challengeId: "3130FB0", name: "Greening" },
];

describe("withLinkedChallengeOptions", () => {
  it("offers the circle's other challenges, valued by challenge ID", () => {
    const form = withLinkedChallengeOptions(step1, circleChallenges, "OWN0001");
    const linked = form.find((f) => f.name === "linkedChallenge")!;
    expect(linked.options).toEqual([
      { label: "Compost Sprint · EF55B3E", value: "EF55B3E" },
      { label: "Greening · 3130FB0", value: "3130FB0" },
    ]);
    expect(linked.required).toBe(false);
  });

  it("leaves forms without the field untouched", () => {
    const form = step1.filter((f) => f.name !== "linkedChallenge");
    expect(withLinkedChallengeOptions(form, circleChallenges, "OWN0001")).toBe(form);
  });

  it("puts the field on a wizard screen", () => {
    const form = withLinkedChallengeOptions(step1, circleChallenges, "OWN0001");
    const config = deriveWizardConfig(form, undefined, "registration");
    const names = config.steps.flatMap((s) => s.fields.map((f) => f.name));
    expect(names).toContain("linkedChallenge");
  });
});
