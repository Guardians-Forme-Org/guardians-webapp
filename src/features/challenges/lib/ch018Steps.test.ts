import { describe, expect, it } from "vitest";
import type { ApiTemplateFormField, RegisterEntry } from "@/lib/types/challenges";
import { DATA_ENVELOPE_KEYS, isAnchorPointKey } from "@/lib/types/contractKeys";
import { deriveWizardConfig, REGISTER_PICK_FIELD_NAME, withRegisterPicker } from "./deriveWizardConfig";

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

// CH-018 as the template ships it after the restructure: preparation, a
// field survey listing surfaces on the region, and analysis merged into
// completion, picking each surveyed surface back by name
const preparationForm = [
  field("anchorPoint", "GROUP", {
    displayOrder: 1,
    fields: [field("location", "LOCATION", { displayOrder: 1 }), field("name", "TEXT", { displayOrder: 2 })],
  }),
  field("boundary", "TEXT", { displayOrder: 2 }),
  field("surveyArea", "NUMERIC", { displayOrder: 3 }),
  field("teamMembers", "NUMERIC", { displayOrder: 4 }),
  field("irDeviceAvailable", "TOGGLE", { displayOrder: 5 }),
  ...hoursAndContributors,
];
const surfaceFields = [
  field("name", "TEXT", { displayOrder: 1 }),
  field("location", "LOCATION", { displayOrder: 2 }),
  field("surfaceType", "SELECT", { displayOrder: 3, options: [{ value: "OTHER", label: "Other" }] }),
  field("estimatedArea", "NUMERIC", { displayOrder: 4 }),
  field("sunExposure", "SELECT", { displayOrder: 5, options: [{ value: "HIGH", label: "High" }] }),
  field("temperature", "NUMERIC", { displayOrder: 6, required: false }),
  field("notes", "TEXTAREA", { displayOrder: 7, required: false }),
  field("mediaFile", "IMAGE", { displayOrder: 8 }),
];
const surveyForm = [
  field("anchorPoint", "GROUP", {
    displayOrder: 1,
    fields: [field("surfaces", "ITEM", { displayOrder: 1, addableInput: true, fields: surfaceFields })],
  }),
  ...hoursAndContributors,
];
const analysisForm = [
  field("surfaces", "ITEM", {
    displayOrder: 1,
    addableInput: true,
    source: { stepId: "FieldSurvey", field: "surfaces", lockedFields: ["name"] },
    fields: [
      field("name", "TEXT", { displayOrder: 1 }),
      field("priorityLevel", "SELECT", { displayOrder: 2, options: [{ value: "HIGH", label: "High" }] }),
      field("recommendation", "TEXTAREA", { displayOrder: 3, required: false }),
    ],
  }),
  field("reflection", "TEXT", { displayOrder: 2 }),
  field("reportShared", "TOGGLE", { displayOrder: 3, required: false }),
  field("actionsTriggered", "TEXT", { displayOrder: 4, required: false }),
  field("completed", "TOGGLE", { displayOrder: 5 }),
  ...hoursAndContributors,
];

describe("CH-018 preparation step", () => {
  const config = deriveWizardConfig(preparationForm, undefined, "registration", false);

  it("registers the region, then asks the planning questions on their own screen", () => {
    expect(config.steps.map((s) => s.kind)).toEqual(["dynamic", "dynamic", "volunteer-hours", "contributors", "review"]);
    expect(config.steps[1].fields.map((f) => f.name)).toEqual(["boundary", "surveyArea", "teamMembers", "irDeviceAvailable"]);
    for (const name of ["boundary", "surveyArea", "teamMembers", "irDeviceAvailable"]) expect(envelopeKeys.has(name)).toBe(true);
  });
});

describe("CH-018 field survey step", () => {
  const config = deriveWizardConfig(surveyForm, setup, "execution", false);

  it("picks the region, then lists surfaces as repeating entries", () => {
    expect(config.steps[0].kind).toBe("setup-update");
    const list = config.steps[1].fields[0];
    expect(list.name).toBe("surfaces");
    expect(list.addableInput).toBe(true);
    expect(list.fields?.map((f) => f.name)).toEqual(surfaceFields.map((f) => f.name));
  });

  it("submits the list on the region, under a key the BE holds", () => {
    expect(config.anchorDetailFields.map((f) => f.name)).toEqual(["surfaces"]);
    expect(isAnchorPointKey("surfaces")).toBe(true);
  });

  // Same constraint as CH-020's species: with anchorPointTracking on, the
  // list's subfields are read as one reading per point and the rows are lost
  it("would lose the repeating rows with anchorPointTracking on", () => {
    const tracked = deriveWizardConfig(surveyForm, setup, "execution", true);
    expect(tracked.steps.some((s) => s.fields.some((f) => f.name === "surfaces"))).toBe(false);
  });
});

describe("CH-018 analysis and completion step", () => {
  const surveyed: RegisterEntry[] = [
    { anchorPoint: "District VIII", values: { name: "Car park behind the school" }, submissionId: "a", submittedAt: "" },
    { anchorPoint: "District VIII", values: { name: "Market roof" }, submissionId: "a", submittedAt: "" },
  ];
  const form = withRegisterPicker(analysisForm, new Map([["surfaces", surveyed]]), "Pick a surface");
  const config = deriveWizardConfig(form, setup, "completion", false);

  it("offers each surveyed surface by name to rate", () => {
    const list = config.steps[0].fields[0];
    const picker = list.fields?.find((f) => f.name === REGISTER_PICK_FIELD_NAME);
    expect(picker?.options?.map((o) => o.label)).toEqual([
      "Car park behind the school · District VIII",
      "Market roof · District VIII",
    ]);
    expect(picker?.options?.[0].fill).toEqual({ name: "Car park behind the school" });
  });

  it("then asks for the completion details and ends with the completion flag and review", () => {
    expect(config.steps.map((s) => s.kind)).toEqual([
      "dynamic", "dynamic", "volunteer-hours", "contributors", "mark-complete", "review",
    ]);
    expect(config.steps[1].fields.map((f) => f.name)).toEqual(["reflection", "reportShared", "actionsTriggered"]);
    for (const name of ["surfaces", "reportShared", "actionsTriggered"]) expect(envelopeKeys.has(name)).toBe(true);
  });

  it("falls back to typed entries when nothing has been surveyed yet", () => {
    const empty = withRegisterPicker(analysisForm, new Map(), "Pick a surface");
    expect(empty[0].fields?.some((f) => f.name === REGISTER_PICK_FIELD_NAME)).toBe(false);
  });
});
