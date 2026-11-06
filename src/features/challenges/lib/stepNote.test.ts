import { describe, expect, it } from "vitest";
import type { ApiTemplateFormField } from "@/lib/types/challenges";
import type { DerivedWizardConfig } from "./deriveWizardConfig";
import { noteFields, stepNoteSubmission, stepNoteValues, withNoteStep } from "./stepNote";

const labels = { note: "Note", notePlaceholder: "…", photo: "Photo", photoPlaceholder: "…" };
const field = (name: string, displayOrder: number): ApiTemplateFormField => ({
  name,
  label: name,
  type: "TEXTAREA",
  required: false,
  displayOrder,
});

describe("noteFields", () => {
  it("adds a note and a photo after the template's fields", () => {
    const fields = noteFields([field("a", 1), field("b", 7)], labels);
    expect(fields.map((f) => [f.name, f.type, f.displayOrder])).toEqual([
      ["stepNote", "TEXTAREA", 8],
      ["notePhoto", "IMAGE", 9],
    ]);
  });

  it("offers only the photo when the step has its own notes field", () => {
    expect(noteFields([field("notes", 1)], labels).map((f) => f.name)).toEqual(["notePhoto"]);
  });
});

describe("withNoteStep", () => {
  const config = (kinds: DerivedWizardConfig["steps"][number]["kind"][]): DerivedWizardConfig => ({
    steps: kinds.map((kind) => ({ kind, fields: [] })),
    fieldToStepIndex: { a: 1, hours: 2, done: 3 },
    anchorDetailFields: [],
  });
  const note = noteFields([], labels);

  it("goes before the completion screen, which submits straight away", () => {
    const out = withNoteStep(config(["dynamic", "volunteer-hours", "mark-complete", "review"]), note);
    expect(out.steps.map((s) => s.kind)).toEqual(["dynamic", "volunteer-hours", "dynamic", "mark-complete", "review"]);
    expect(out.steps[2].fields).toBe(note);
    expect(out.fieldToStepIndex).toEqual({ a: 1, hours: 2, done: 4, stepNote: 3, notePhoto: 3 });
  });

  it("goes before review when there is no completion screen", () => {
    const out = withNoteStep(config(["dynamic", "volunteer-hours", "review"]), note);
    expect(out.steps.map((s) => s.kind)).toEqual(["dynamic", "volunteer-hours", "dynamic", "review"]);
  });
});

describe("stepNoteSubmission", () => {
  it("puts the note in the envelope and the new photo in its own part", () => {
    const photo = new File(["x"], "p.jpg", { type: "image/jpeg" });
    expect(stepNoteSubmission([], { stepNote: "  hedgehog seen ", notePhoto: photo })).toEqual({
      envelope: { notes: "hedgehog seen" },
      notePhoto: photo,
    });
  });

  it("keeps a stored photo and sends nothing for an empty note", () => {
    expect(stepNoteSubmission([], { stepNote: " ", notePhoto: "https://x/p.jpg" })).toEqual({
      envelope: { notePhoto: { url: "https://x/p.jpg" } },
    });
  });

  it("leaves a step's own notes field to the step", () => {
    expect(stepNoteSubmission([field("notes", 1)], { stepNote: "action taken" })).toEqual({ envelope: {} });
  });
});

describe("stepNoteValues", () => {
  it("reads a stored note and photo back", () => {
    expect(stepNoteValues([], { notes: "n", notePhoto: { url: "u", type: "image/jpeg" } })).toEqual({
      stepNote: "n",
      notePhoto: "u",
    });
  });

  it("skips what isn't there", () => {
    expect(stepNoteValues([], { notePhoto: { url: "" } })).toEqual({});
  });
});
