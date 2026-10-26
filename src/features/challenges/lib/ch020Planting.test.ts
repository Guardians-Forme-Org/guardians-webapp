import { describe, expect, it } from "vitest";
import type { ApiTemplateFormField } from "@/lib/types/challenges";
import { isAnchorPointKey } from "@/lib/types/contractKeys";
import { deriveWizardConfig } from "./deriveWizardConfig";

const field = (
  name: string,
  type: ApiTemplateFormField["type"],
  extra: Partial<ApiTemplateFormField> = {},
): ApiTemplateFormField => ({ name, label: name, type, required: false, displayOrder: 0, ...extra });

// CH-020 step 3 ("Planting and connection") as the template ships it: the
// species list sits inside the rain garden's anchor point reference
const plantingForm = [
  field("anchorPoint", "GROUP", {
    required: true,
    displayOrder: 1,
    fields: [
      field("waterSourceTypeConnected", "SELECT", {
        required: true,
        displayOrder: 1,
        options: [{ value: "DOWNPIPE_DIVERTER", label: "Downpipe diverter" }],
      }),
      field("species", "ITEM", {
        required: true,
        addableInput: true,
        displayOrder: 2,
        fields: [
          field("name", "TEXT", { required: true, displayOrder: 1 }),
          field("native", "TOGGLE", { displayOrder: 2 }),
          field("quantity", "NUMERIC", { required: true, displayOrder: 3 }),
        ],
      }),
      field("mediaFile", "IMAGE", { required: true, displayOrder: 3 }),
    ],
  }),
  field("volunteerHours", "NUMERIC", { required: true, displayOrder: 4 }),
  field("contributors", "TEXT", { required: true, displayOrder: 5 }),
];
const setup = {
  anchorPoints: [{ name: "Garden A", location: { latitude: 1, longitude: 2, formattedAddress: "x" } }],
} as Parameters<typeof deriveWizardConfig>[1];

describe("CH-020 planting step", () => {
  const config = deriveWizardConfig(plantingForm, setup, "execution", false);

  it("starts by picking the registered rain garden", () => {
    expect(config.steps[0].kind).toBe("setup-update");
    expect(config.steps[0].anchorPoints).toHaveLength(1);
  });

  it("keeps the species list whole, as its own repeating screen", () => {
    const species = config.steps.find((s) => s.fields.some((f) => f.name === "species"));
    expect(species?.kind).toBe("dynamic");
    const list = species!.fields.find((f) => f.name === "species")!;
    expect(list.addableInput).toBe(true);
    expect(list.fields?.map((f) => f.name)).toEqual(["name", "native", "quantity"]);
  });

  it("submits the list on the garden, under a key the BE holds as a list", () => {
    expect(config.anchorDetailFields.map((f) => f.name)).toEqual(
      expect.arrayContaining(["waterSourceTypeConnected", "species", "mediaFile"]),
    );
    for (const f of config.anchorDetailFields) expect(isAnchorPointKey(f.name)).toBe(true);
  });

  it("ends with hours, contributors and review", () => {
    expect(config.steps.slice(-3).map((s) => s.kind)).toEqual([
      "volunteer-hours",
      "contributors",
      "review",
    ]);
  });

  // The template leaves anchorPointTracking off for this step. Switched on,
  // the list's subfields are read as one reading per point and the repeating
  // rows are gone — this pins why it has to stay off.
  it("would lose the repeating rows with anchorPointTracking on", () => {
    const tracked = deriveWizardConfig(plantingForm, setup, "execution", true);
    expect(tracked.steps.some((s) => s.fields.some((f) => f.name === "species"))).toBe(false);
  });
});
