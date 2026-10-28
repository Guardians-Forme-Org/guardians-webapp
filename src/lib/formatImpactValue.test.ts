import { describe, expect, it } from "vitest";
import { formatImpactMetricValue } from "./utils";

describe("formatImpactMetricValue", () => {
  it("reads a count unit singular for exactly 1", () => {
    expect(formatImpactMetricValue({ value: 1, unitOfMeasure: "cooling points" })).toBe("1 cooling point");
    expect(formatImpactMetricValue({ value: 1, unitOfMeasure: "gardens" })).toBe("1 garden");
    expect(formatImpactMetricValue({ value: 1, unitOfMeasure: "volunteers" })).toBe("1 volunteer");
    expect(formatImpactMetricValue({ value: 1.04, unitOfMeasure: "hours" })).toBe("1 hour");
  });

  it("keeps the plural for other amounts", () => {
    expect(formatImpactMetricValue({ value: 2, unitOfMeasure: "gardens" })).toBe("2 gardens");
    expect(formatImpactMetricValue({ value: 0, unitOfMeasure: "trees" })).toBe("0 trees");
    expect(formatImpactMetricValue({ value: 1.5, unitOfMeasure: "hours" })).toBe("1.5 hours");
    expect(formatImpactMetricValue({ value: 11, unitOfMeasure: "households" })).toBe("11 households");
  });

  it("leaves units without a singular alone", () => {
    expect(formatImpactMetricValue({ value: 1, unitOfMeasure: "species" })).toBe("1 species");
    expect(formatImpactMetricValue({ value: 1, unitOfMeasure: "m²" })).toBe("1 m²");
    expect(formatImpactMetricValue({ value: 1, unitOfMeasure: "kg" })).toBe("1 kg");
  });

  it("applies to a displayName too", () => {
    expect(formatImpactMetricValue({ displayName: "1 trees" })).toBe("1 tree");
  });
});
