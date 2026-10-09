import { describe, expect, it } from "vitest";
import type { ApiTemplateFormField } from "@/lib/types/challenges";
import { DATA_ENVELOPE_KEYS, isAnchorPointKey } from "@/lib/types/contractKeys";
import { deriveWizardConfig, isDisplayContainer } from "./deriveWizardConfig";

const field = (
  name: string,
  type: ApiTemplateFormField["type"],
  extra: Partial<ApiTemplateFormField> = {},
): ApiTemplateFormField => ({ name, label: name, type, required: true, displayOrder: 0, ...extra });

const envelopeKeys = new Set<string>(DATA_ENVELOPE_KEYS);
const hoursAndContributors = [
  field("volunteerHours", "NUMERIC", { displayOrder: 8 }),
  field("contributors", "TEXT", { displayOrder: 9 }),
];
const setup = {
  anchorPoints: [{ name: "District VIII", location: { latitude: 1, longitude: 2, formattedAddress: "x" } }],
} as Parameters<typeof deriveWizardConfig>[1];

// CH-014 as the template ships it: the registered point is the region, and
// each institution is one submission against it
const institutionForm = [
  field("anchorPoint", "GROUP", { displayOrder: 1 }),
  field("siteMetadata", "GROUP", {
    displayOrder: 1,
    fields: [
      field("location", "LOCATION", { displayOrder: 1 }),
      field("name", "TEXT", { displayOrder: 2 }),
      field("institutionType", "SELECT", { displayOrder: 3, options: [{ value: "OTHER", label: "Other" }] }),
      field("confirmAccessible", "TOGGLE", { displayOrder: 4 }),
      field("openingHour", "TIME", { displayOrder: 5 }),
      field("closingHour", "TIME", { displayOrder: 6 }),
      field("mediaFile", "IMAGE", { displayOrder: 7, required: false }),
      field("verificationMethod", "SELECT", { displayOrder: 8, options: [{ value: "PHONE_CALL", label: "Phone call" }] }),
      field("dateVerified", "DATE", { displayOrder: 9 }),
    ],
  }),
  ...hoursAndContributors,
];
const outreachForm = [
  field("anchorPoint", "GROUP", {
    displayOrder: 1,
    fields: [
      field("outreachMethods", "MULTISELECT", { displayOrder: 1, options: [{ value: "LEAFLET", label: "Leaflet" }] }),
      field("householdsReached", "NUMERIC", { displayOrder: 2 }),
    ],
  }),
  field("volunteersActive", "NUMERIC", { displayOrder: 3 }),
  ...hoursAndContributors,
];

describe("CH-014 institution step", () => {
  const config = deriveWizardConfig(institutionForm, setup, "execution", false);

  it("picks the registered region, then shows the institution as one card", () => {
    expect(config.steps[0].kind).toBe("setup-update");
    const card = config.steps[1].fields[0];
    expect(isDisplayContainer(card)).toBe(true);
    expect(card.fields?.map((f) => f.name)).toEqual([
      "location", "name", "institutionType", "confirmAccessible", "openingHour",
      "closingHour", "mediaFile", "verificationMethod", "dateVerified",
    ]);
  });

  // The card is flattened into the envelope on submit, so each of its fields
  // needs an envelope key — confirmAccessible is the BE's spelling
  it("holds only fields the envelope has a key for", () => {
    for (const f of config.steps[1].fields[0].fields ?? []) expect(envelopeKeys.has(f.name)).toBe(true);
    expect(envelopeKeys.has("confirmedAccessible")).toBe(false);
  });

  it("asks for opening and closing as two times, without folding either into the date", () => {
    const card = config.steps[1].fields[0];
    expect(card.fields?.filter((f) => f.type === "TIME").map((f) => f.name)).toEqual(["openingHour", "closingHour"]);
  });
});

describe("CH-014 outreach step", () => {
  const config = deriveWizardConfig(outreachForm, setup, "execution", false);

  it("logs methods and households against the region, and volunteers for the step", () => {
    expect(config.anchorDetailFields.map((f) => f.name)).toEqual(["outreachMethods", "householdsReached"]);
    for (const f of config.anchorDetailFields) expect(isAnchorPointKey(f.name)).toBe(true);
    expect(envelopeKeys.has("volunteersActive")).toBe(true);
  });

  it("does not ask for the outreach date, and ends with hours, contributors, review", () => {
    expect(config.steps.flatMap((s) => s.fields.map((f) => f.name))).not.toContain("outreachDate");
    expect(config.steps.slice(-3).map((s) => s.kind)).toEqual(["volunteer-hours", "contributors", "review"]);
  });
});
