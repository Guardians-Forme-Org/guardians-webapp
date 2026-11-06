import type { ApiTemplateFormField } from "@/lib/types/challenges";
import type { DerivedStep, DerivedWizardConfig } from "./deriveWizardConfig";

// Every step of every challenge takes an optional note and photo, so whatever
// a group did that the step's own fields don't cover is still recorded
// (Pal's order, Nov 2026). Templates don't declare them: the wizard adds one
// screen for both, before the completion screen and review. The API keeps the
// note as dataEnvelope.notes and the photo, sent as the "notePhoto" form part,
// as dataEnvelope.notePhoto.

// Wizard value keys. The note has its own key because "notes" can already be a
// point's field on the same screens (CH-002, CH-013); it is stored as notes.
export const NOTE_TEXT_FIELD = "stepNote";
export const NOTE_PHOTO_FIELD = "notePhoto";
const ENVELOPE_NOTES = "notes";

export type NoteLabels = {
  note: string;
  notePlaceholder: string;
  photo: string;
  photoPlaceholder: string;
};

// A step that already asks for "notes" itself (CH-007 step 3's "Action
// taken") keeps its own field; the note screen then offers only the photo
const hasOwnNotes = (stepForm: ApiTemplateFormField[]) =>
  stepForm.some((f) => f.name === ENVELOPE_NOTES);

// The note screen's fields, listed after everything the template has
export function noteFields(
  stepForm: ApiTemplateFormField[],
  labels: NoteLabels,
): ApiTemplateFormField[] {
  const last = Math.max(0, ...stepForm.map((f) => f.displayOrder ?? 0));
  const photo: ApiTemplateFormField = {
    name: NOTE_PHOTO_FIELD,
    type: "IMAGE",
    label: labels.photo,
    placeholder: labels.photoPlaceholder,
    required: false,
    displayOrder: last + 2,
  };
  if (hasOwnNotes(stepForm)) return [photo];
  return [
    {
      name: NOTE_TEXT_FIELD,
      type: "TEXTAREA",
      label: labels.note,
      placeholder: labels.notePlaceholder,
      required: false,
      displayOrder: last + 1,
    },
    photo,
  ];
}

// The wizard with the note screen added before the completion screen (which
// submits straight away) or, without one, before review
export function withNoteStep(
  config: DerivedWizardConfig,
  fields: ApiTemplateFormField[],
): DerivedWizardConfig {
  if (!fields.length) return config;
  const found = config.steps.findIndex((s) => s.kind === "mark-complete" || s.kind === "review");
  const at = found === -1 ? config.steps.length : found;
  const note: DerivedStep = { kind: "dynamic", fields };
  const fieldToStepIndex: Record<string, number> = {};
  for (const [name, index] of Object.entries(config.fieldToStepIndex)) {
    fieldToStepIndex[name] = index > at ? index + 1 : index;
  }
  for (const f of fields) fieldToStepIndex[f.name] = at + 1;
  return {
    ...config,
    steps: [...config.steps.slice(0, at), note, ...config.steps.slice(at)],
    fieldToStepIndex,
  };
}

// What the note screen adds to a submission. The note goes into the envelope
// (unless the step's own "notes" field already carries it); a newly picked
// photo goes as its own form part, and one already stored (editing an entry)
// is kept by sending it back as it is.
export function stepNoteSubmission(
  stepForm: ApiTemplateFormField[],
  values: Record<string, unknown>,
): { envelope: Record<string, unknown>; notePhoto?: File } {
  const envelope: Record<string, unknown> = {};
  const text = values[NOTE_TEXT_FIELD];
  if (!hasOwnNotes(stepForm) && typeof text === "string" && text.trim()) {
    envelope[ENVELOPE_NOTES] = text.trim();
  }
  const photo = values[NOTE_PHOTO_FIELD];
  if (typeof File !== "undefined" && photo instanceof File) return { envelope, notePhoto: photo };
  if (typeof photo === "string" && photo) envelope[NOTE_PHOTO_FIELD] = { url: photo };
  return { envelope };
}

// A stored entry's note and photo, as the note screen's values
export function stepNoteValues(
  stepForm: ApiTemplateFormField[],
  data: Record<string, unknown>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  const text = data[ENVELOPE_NOTES];
  if (!hasOwnNotes(stepForm) && typeof text === "string" && text) values[NOTE_TEXT_FIELD] = text;
  const url = (data[NOTE_PHOTO_FIELD] as { url?: unknown } | null | undefined)?.url;
  if (typeof url === "string" && url) values[NOTE_PHOTO_FIELD] = url;
  return values;
}
