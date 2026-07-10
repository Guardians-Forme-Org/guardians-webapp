import type { ApiTemplateFormField, ChallengeSetupAnchorPoint } from "@/lib/types/challenges";

export type DerivedStepKind =
  | "volunteer-hours"
  | "contributors"
  | "mark-complete"
  | "dynamic"
  | "setup-update"
  | "review";

export type DerivedStep = {
  kind: DerivedStepKind;
  fields: ApiTemplateFormField[];
  // setup-update only: the previously registered entries being re-measured
  anchorPoints?: ChallengeSetupAnchorPoint[];
};

// Setup-step data carried by the challenge (submittedSetupDetail.data) —
// feeds the setup-update screen of later steps
export type SetupUpdateSource = {
  anchorPoints?: ChallengeSetupAnchorPoint[] | null;
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

export function deriveWizardConfig(
  fields: ApiTemplateFormField[],
  setupData?: SetupUpdateSource,
): DerivedWizardConfig {
  const sorted = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);

  // A SELECT named "locations" is the BE's reference to the points registered
  // during the setup step. When the challenge carries those, the field becomes
  // an update-values screen (fixed set — no adding or removing points).
  const anchorPoints = setupData?.anchorPoints ?? [];
  let pointsField = anchorPoints.length
    ? sorted.find((f) => f.type === "SELECT" && f.name.toLowerCase() === "locations")
    : undefined;

  // Fallback (CH-008A/B): the BE ships the anchor-points reference as a
  // degenerate field — all-blank (CH-008A) or named but type-less (CH-008B's
  // ANCHOR_POINT_NAME). When registered points exist, adopt it as the points
  // field so the step still renders the CH-001-style update screen. Adopted
  // under the name "locations" so payload/view-mode keys stay consistent.
  if (!pointsField && anchorPoints.length) {
    const degenerate = sorted.find((f) => !f.type);
    if (degenerate) {
      pointsField = {
        ...degenerate,
        name: "locations",
        type: "SELECT",
        label: degenerate.label || "Observation Points",
      };
      sorted[sorted.indexOf(degenerate)] = pointsField;
    }
  }
  // The per-point risk flag renders inside each entry card, not as its own field
  const flagField = pointsField
    ? sorted.find((f) => (f.type === "TOGGLE" || f.type === "BOOLEAN") && f.name === "FLAG")
    : undefined;
  const setupUpdateNames = new Set(
    [pointsField?.name, flagField?.name].filter((n): n is string => !!n),
  );

  const knownNameFields: ApiTemplateFormField[] = [];
  const soloFields: ApiTemplateFormField[] = [];
  const batchableFields: ApiTemplateFormField[] = [];

  for (const field of sorted) {
    if (setupUpdateNames.has(field.name)) {
      continue;
    } else if (VOLUNTEER_HOURS_NAMES.has(field.name) || CONTRIBUTORS_NAMES.has(field.name) || COMPLETION_NAMES.has(field.name)) {
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

  // 0. Re-measure previously registered points — the heart of such a step
  if (pointsField) {
    push({
      kind: "setup-update",
      fields: flagField ? [pointsField, flagField] : [pointsField],
      anchorPoints,
    });
  }

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
