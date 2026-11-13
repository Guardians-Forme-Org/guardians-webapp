import type { LegalSection } from "@/components/LegalDocument";

// Every line of a section, in reading order, for searching
export function sectionLines(section: LegalSection): string[] {
  return [
    section.heading,
    ...section.content,
    ...(section.lists ?? []).flatMap((l) => [l.label, l.intro, ...(l.items ?? []), l.note?.text]),
    ...(section.trailingContent ?? []),
  ].filter((line): line is string => !!line);
}

export type SectionMatch = { section: LegalSection; snippet?: string };

// Sections containing every word of the query. A section whose heading
// doesn't match also returns the first matching line, to show under it.
export function searchSections(sections: LegalSection[], query: string): SectionMatch[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return sections.map((section) => ({ section }));
  return sections.flatMap((section) => {
    const lines = sectionLines(section);
    const all = lines.join(" ").toLowerCase();
    if (!words.every((w) => all.includes(w))) return [];
    const heading = section.heading.toLowerCase();
    if (words.some((w) => heading.includes(w))) return [{ section }];
    const snippet = lines.find((line) => words.some((w) => line.toLowerCase().includes(w)));
    return [{ section, snippet }];
  });
}
