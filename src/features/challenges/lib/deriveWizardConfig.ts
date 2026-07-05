import type { ApiTemplateFormField } from "@/lib/types/challenges";

export type DerivedStepKind =
  | "volunteer-hours"
  | "contributors"
  | "mark-complete"
  | "dynamic"
  | "review";

export type DerivedStep = {
  kind: DerivedStepKind;
  fields: ApiTemplateFormField[];
};

export type DerivedWizardConfig = {
  steps: DerivedStep[];
  // 1-based step index for each field name — used by review to navigate back
  fieldToStepIndex: Record<string, number>;
};

const VOLUNTEER_HOURS_NAMES = new Set(["VOLUNTEER_HOURS", "VOLUNTEERS_HOURS"]);
const CONTRIBUTORS_NAMES = new Set(["CONTRIBUTORS"]);
const COMPLETION_NAMES = new Set(["CONFIRM_COMPLETION", "CONFIRMATION"]);

// Fields that are heavy UI (need their own wizard screen)
const SOLO_TYPES = new Set(["LOCATION", "LOCATION_LIST", "IMAGE", "GROUP"]);

const DYNAMIC_BATCH_SIZE = 4;

export function deriveWizardConfig(fields: ApiTemplateFormField[]): DerivedWizardConfig {
  const sorted = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);

  const knownNameFields: ApiTemplateFormField[] = [];
  const soloFields: ApiTemplateFormField[] = [];
  const batchableFields: ApiTemplateFormField[] = [];

  for (const field of sorted) {
    if (VOLUNTEER_HOURS_NAMES.has(field.name) || CONTRIBUTORS_NAMES.has(field.name) || COMPLETION_NAMES.has(field.name)) {
      knownNameFields.push(field);
    } else if (SOLO_TYPES.has(field.type)) {
      soloFields.push(field);
    } else {
      batchableFields.push(field);
    }
  }

  const steps: DerivedStep[] = [];
  const fieldToStepIndex: Record<string, number> = {};

  const push = (step: DerivedStep) => {
    steps.push(step);
    step.fields.forEach((f) => {
      fieldToStepIndex[f.name] = steps.length;
    });
  };

  // 1. Heavy solo fields — each gets its own screen
  for (const field of soloFields) {
    push({ kind: "dynamic", fields: [field] });
  }

  // 2. Simple fields — batched
  for (let i = 0; i < batchableFields.length; i += DYNAMIC_BATCH_SIZE) {
    push({ kind: "dynamic", fields: batchableFields.slice(i, i + DYNAMIC_BATCH_SIZE) });
  }

  // 3. Volunteer hours
  const vhField = knownNameFields.find((f) => VOLUNTEER_HOURS_NAMES.has(f.name));
  if (vhField) push({ kind: "volunteer-hours", fields: [vhField] });

  // 4. Contributors
  const contribField = knownNameFields.find((f) => CONTRIBUTORS_NAMES.has(f.name));
  if (contribField) push({ kind: "contributors", fields: [contribField] });

  // 5. Completion confirmation
  const completionField = knownNameFields.find((f) => COMPLETION_NAMES.has(f.name));
  if (completionField) push({ kind: "mark-complete", fields: [completionField] });

  // Always end with review
  steps.push({ kind: "review", fields: [] });

  return { steps, fieldToStepIndex };
}
