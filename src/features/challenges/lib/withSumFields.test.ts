import { describe, expect, it } from "vitest";
import type { ApiTemplateFormField } from "@/lib/types/challenges";
import { withSumFields } from "./deriveWizardConfig";

const field = (
  name: string,
  type: ApiTemplateFormField["type"],
  extra: Partial<ApiTemplateFormField> = {},
): ApiTemplateFormField => ({ name, label: name, type, required: false, displayOrder: 0, ...extra });

const sumOf = { field: "species", of: "quantity" };
const species = field("species", "ITEM", {
  addableInput: true,
  fields: [field("name", "TEXT"), field("quantity", "NUMBER")],
});

// CH-011/CH-015/CH-016 as staging and prod ship them: the total sits beside
// the species list, next to the anchor point reference
const besideForm = [
  field("anchorPoint", "GROUP"),
  species,
  field("speciesPlanted", "NUMERIC", { required: true, sumOf }),
  field("nativeSpeciesCount", "NUMERIC"),
];

describe("withSumFields — total beside the list", () => {
  it("adds up the quantities, skipping entries without one", () => {
    const values = {
      species: [{ name: "Oak", quantity: "3" }, { name: "Ash", quantity: "4.5" }, { name: "Elm" }],
    };
    expect(withSumFields(besideForm, values).speciesPlanted).toBe("7.5");
  });

  it("replaces a total typed in before the field was computed", () => {
    const values = { species: [{ quantity: "2" }], speciesPlanted: "99" };
    expect(withSumFields(besideForm, values).speciesPlanted).toBe("2");
  });

  it("follows entries being added and removed", () => {
    const two = withSumFields(besideForm, { species: [{ quantity: "2" }, { quantity: "5" }] });
    expect(two.speciesPlanted).toBe("7");
    const one = withSumFields(besideForm, { ...two, species: [{ quantity: "2" }] });
    expect(one.speciesPlanted).toBe("2");
  });

  it("keeps a typed total when there is nothing to add up", () => {
    expect(withSumFields(besideForm, { speciesPlanted: "9" }).speciesPlanted).toBe("9");
    expect(withSumFields(besideForm, { species: [{ name: "Oak" }], speciesPlanted: "9" }).speciesPlanted).toBe("9");
  });

  it("leaves the total empty on a blank form, so a required one still blocks", () => {
    expect(withSumFields(besideForm, {}).speciesPlanted).toBeUndefined();
  });

  it("reads quantities as strings, numbers and read-back {value} objects", () => {
    const values = { species: [{ quantity: "1" }, { quantity: 2 }, { quantity: { value: 3 } }] };
    expect(withSumFields(besideForm, values).speciesPlanted).toBe("6");
  });

  it("counts a zero quantity and ignores text that isn't a number", () => {
    const values = { species: [{ quantity: "0" }, { quantity: "abc" }, { quantity: "" }] };
    expect(withSumFields(besideForm, values).speciesPlanted).toBe("0");
  });

  it("does not surface float noise", () => {
    const values = { species: [{ quantity: "0.1" }, { quantity: "0.2" }] };
    expect(withSumFields(besideForm, values).speciesPlanted).toBe("0.3");
  });

  it("touches nothing else, and returns the same object once the total is right", () => {
    const anchorPoint = { id: "point-1" };
    const values = { anchorPoint, species: [{ quantity: "4" }], nativeSpeciesCount: "1" };
    const out = withSumFields(besideForm, values);
    expect(out.anchorPoint).toBe(anchorPoint);
    expect(out.species).toBe(values.species);
    expect(out.nativeSpeciesCount).toBe("1");
    expect(withSumFields(besideForm, out)).toBe(out);
  });

  it("is the identity for a form with no sumOf field", () => {
    const form = [species, field("speciesPlanted", "NUMERIC")];
    const values = { species: [{ quantity: "4" }], speciesPlanted: "1" };
    expect(withSumFields(form, values)).toBe(values);
  });

  it("ignores sumOf on a field that isn't a number", () => {
    const form = [species, field("speciesPlanted", "TEXT", { sumOf })];
    const values = { species: [{ quantity: "4" }] };
    expect(withSumFields(form, values)).toBe(values);
  });
});

// Dev's CH-011: the species list sits inside each addable anchor point, with
// a per-point total next to it and a step-wide total at the top level
describe("withSumFields — list nested in an addable group", () => {
  const form = [
    field("anchorPoint", "GROUP", {
      addableInput: true,
      fields: [field("name", "TEXT"), species, field("plantsAdapted", "NUMBER", { sumOf })],
    }),
    field("speciesUsed", "NUMERIC", { sumOf }),
  ];
  const values = {
    anchorPoint: [
      { name: "A", species: [{ quantity: "1" }, { quantity: "2" }] },
      { name: "B", species: [{ quantity: "10" }] },
    ],
  };

  it("totals each point from its own list", () => {
    const out = withSumFields(form, values) as { anchorPoint: Record<string, unknown>[] };
    expect(out.anchorPoint.map((p) => p.plantsAdapted)).toEqual(["3", "10"]);
    expect(out.anchorPoint.map((p) => p.name)).toEqual(["A", "B"]);
  });

  it("totals the whole step across every point", () => {
    expect(withSumFields(form, values).speciesUsed).toBe("13");
  });

  it("settles in one pass", () => {
    const out = withSumFields(form, values);
    expect(withSumFields(form, out)).toBe(out);
  });
});

// The seed's CH-011: the total sits inside a non-addable display container,
// the list outside it
describe("withSumFields — total inside a display container", () => {
  const form = [
    field("anchorPoint", "GROUP"),
    species,
    field("siteMetadata", "ITEM", {
      fields: [field("speciesPlanted", "NUMERIC", { sumOf }), field("mediaFile", "IMAGE")],
    }),
  ];

  it("creates the container's single entry to hold the total", () => {
    const out = withSumFields(form, { species: [{ quantity: "2" }, { quantity: "2" }] });
    expect(out.siteMetadata).toEqual([{ speciesPlanted: "4" }]);
  });

  it("keeps what the container already holds", () => {
    const out = withSumFields(form, {
      species: [{ quantity: "5" }],
      siteMetadata: [{ mediaFile: "photo.jpg" }],
    });
    expect(out.siteMetadata).toEqual([{ mediaFile: "photo.jpg", speciesPlanted: "5" }]);
  });

  it("leaves an untouched container alone when there is nothing to add up", () => {
    const values = {};
    expect(withSumFields(form, values)).toBe(values);
  });

  it("never rewrites a selected anchor point, which is an object rather than entries", () => {
    const pointForm = [
      field("anchorPoint", "GROUP", { fields: [field("total", "NUMBER", { sumOf })] }),
      species,
    ];
    const anchorPoint = { id: "point-1", values: {} };
    const out = withSumFields(pointForm, { anchorPoint, species: [{ quantity: "2" }] });
    expect(out.anchorPoint).toBe(anchorPoint);
  });
});
