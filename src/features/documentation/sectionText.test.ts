import { describe, expect, it } from "vitest";
import type { LegalSection } from "@/components/LegalDocument";
import { searchSections } from "./sectionText";

const sections: LegalSection[] = [
  { number: 1, heading: "Roles", content: ["Admins can do everything."] },
  {
    number: 2,
    heading: "Steps and evidence",
    content: [],
    lists: [{ label: "Reopening a step", items: ["Tap Reopen step under Completed."] }],
  },
];

describe("searchSections", () => {
  it("lists every section for an empty query", () => {
    expect(searchSections(sections, "  ").map((m) => m.section.number)).toEqual([1, 2]);
  });

  it("finds a section by its heading, without a snippet", () => {
    expect(searchSections(sections, "roles")).toEqual([{ section: sections[0] }]);
  });

  it("shows the matching line for a match inside the text", () => {
    expect(searchSections(sections, "reopen")).toEqual([
      { section: sections[1], snippet: "Reopening a step" },
    ]);
  });

  it("needs every word to be in the section", () => {
    expect(searchSections(sections, "reopen admins")).toEqual([]);
  });
});
