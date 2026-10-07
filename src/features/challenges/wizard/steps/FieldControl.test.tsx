import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import type { ApiTemplateFormField } from "@/lib/types/challenges";
import en from "../../../../../messages/en/challenges.json";
import hu from "../../../../../messages/hu/challenges.json";
import { FieldControl, isFieldMissing } from "./DynamicFieldsStep";

const total: ApiTemplateFormField = {
  name: "speciesPlanted",
  label: "Total Species Planted",
  placeholder: "Enter the total quantity of species planted",
  type: "NUMERIC",
  required: true,
  displayOrder: 2,
};
const computed = { ...total, sumOf: { field: "species", of: "quantity" } };

const render = (
  field: ApiTemplateFormField,
  value: unknown,
  locale = "en",
  messages: Record<string, string> = en,
) =>
  renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={{ challenges: messages }}>
      <FieldControl field={field} value={value} onChange={() => {}} onUnitChange={() => {}} />
    </NextIntlClientProvider>,
  );

describe("FieldControl — a total the template says to work out", () => {
  it("shows the total in a field that can't be typed in, with the reason under it", () => {
    const html = render(computed, "7");
    expect(html).toMatch(/<input[^>]*disabled=""/);
    expect(html).toContain('value="7"');
    expect(html).toContain(en.sumOfHint);
    // The template's "Enter the total…" prompt no longer applies
    expect(html).not.toContain(total.placeholder);
  });

  it("leaves an ordinary number field editable and unannotated", () => {
    const html = render(total, "7");
    expect(html).not.toMatch(/<input[^>]*disabled=""/);
    expect(html).not.toContain(en.sumOfHint);
    expect(html).toContain(total.placeholder);
  });

  it("has the hint in Hungarian", () => {
    expect(hu.sumOfHint).toBeTruthy();
    expect(render(computed, "7", "hu", hu)).toContain(hu.sumOfHint);
  });

  it("still blocks Continue while a required total has nothing to add up", () => {
    expect(isFieldMissing(computed, undefined)).toBe(true);
    expect(isFieldMissing(computed, "7")).toBe(false);
  });
});
