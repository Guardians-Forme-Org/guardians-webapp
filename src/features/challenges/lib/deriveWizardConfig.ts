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
  // setup-update only: pick a point, no new reading (per-point data, if any,
  // is collected by the promoted anchor-detail screens that follow)
  selectionOnly?: boolean;
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
  // Leaf fields promoted out of an adopted anchor-reference GROUP — rendered
  // as regular dynamic screens; the payload nests the AnchorPoint-struct ones
  // back under data.anchorPoint
  anchorDetailFields: ApiTemplateFormField[];
};

// Templates are migrating from SCREAMING_SNAKE to camelCase field names
// (CH-004/CH-008* are camelCase; CH-001/002/009/010/015 still uppercase) —
// match on an underscore-stripped uppercase key so both conventions work
// Tolerates the degenerate nameless field CH-008A ships as its anchor ref
export const normalizeFieldName = (name: string | undefined) =>
  (name ?? "").replace(/_/g, "").toUpperCase();

const VOLUNTEER_HOURS_NAMES = new Set(["VOLUNTEERHOURS", "VOLUNTEERSHOURS"]);
const CONTRIBUTORS_NAMES = new Set(["CONTRIBUTORS"]);
export const COMPLETION_NAMES = new Set([
  "CONFIRMCOMPLETION",
  "CONFIRMATION",
  "CONFIRM",
  // ch-008A/009/010 COMPLETION steps name the flag "completed"
  "COMPLETED",
]);

// Fields that are heavy UI (need their own wizard screen)
const SOLO_TYPES = new Set(["LOCATION", "LOCATION_LIST", "IMAGE", "GROUP"]);

const DYNAMIC_BATCH_SIZE = 4;

// Subfields of an anchor-reference GROUP that describe the registered point
// itself — they come from the setup submission, never re-entered
const ANCHOR_IDENTITY_NAMES = new Set(["ANCHORPOINTNAME", "LOCATION"]);

// Data keys the BE nests under data.anchorPoint (Go AnchorPoint struct)
// rather than at the top level of data
export const ANCHOR_POINT_DATA_NAMES = new Set([
  "MEASUREMENT",
  "OPENINGHOURS",
  "PERMISSIONOBTAINED",
  "OPENED",
  "WATERACCESS",
  "SHADETYPE",
  "ORIENTATION",
  "NOTES",
  "HIGHERRISKFLAG",
]);

// Usable data-entry subfields of a GROUP: typed, not a nested GROUP, and not
// the registered point's identity
const usableLeaves = (group: ApiTemplateFormField) =>
  (group.fields ?? [])
    .filter(
      (f) =>
        !!f.type &&
        f.type !== "GROUP" &&
        !ANCHOR_IDENTITY_NAMES.has(normalizeFieldName(f.name)),
    )
    .sort((a, b) => a.displayOrder - b.displayOrder);

export function deriveWizardConfig(
  fields: ApiTemplateFormField[],
  setupData?: SetupUpdateSource,
  // Template stepType of the step being derived (EXECUTION, COMPLETION, …) —
  // gates whether a placeholder's nested per-anchor fields are promoted
  stepType?: string,
): DerivedWizardConfig {
  const sorted = [...fields].sort((a, b) => a.displayOrder - b.displayOrder);

  // A SELECT named "locations" (or "anchorPoint" — CH-001's BASELINE_OBSERVATION
  // shape) is the BE's reference to the points registered during the setup
  // step. When the challenge carries those, the field becomes an
  // update-values screen (fixed set — no adding or removing points).
  const anchorPoints = setupData?.anchorPoints ?? [];
  let selectionOnly = false;
  let pointsField = anchorPoints.length
    ? sorted.find(
        (f) =>
          f.type === "SELECT" &&
          (f.name.toLowerCase() === "locations" ||
            normalizeFieldName(f.name) === "ANCHORPOINT"),
      )
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

  // Newer templates (CH-008B/C EXECUTION+COMPLETION, CH-010 SETUP/OUTREACH)
  // ship the reference as a non-addable GROUP named "anchorPoint": select one
  // of the registered points. Its shape varies —
  //   • no usable leaves (empty / nested placeholder GROUP / location only):
  //     pure reference, adopt even before any points exist so the placeholder
  //     never renders as a form
  //   • usable leaves (CH-010 SETUP: shadeType, setupDate, …): per-anchor data
  //     entry — adopt only when registered points exist, and promote the
  //     leaves to regular dynamic fields
  // A placeholder's *nested* GROUP ("anchorPointA") carries the intended
  // per-anchor fields; promote those only on COMPLETION steps — during
  // EXECUTION the flow is select-point + log hours (per Tshaks).
  const anchorDetailFields: ApiTemplateFormField[] = [];
  if (!pointsField) {
    const refGroup = sorted.find(
      (f) =>
        f.type === "GROUP" &&
        !f.addableInput &&
        normalizeFieldName(f.name) === "ANCHORPOINT",
    );
    if (refGroup) {
      const directLeaves = usableLeaves(refGroup);
      const isPureReference = directLeaves.length === 0;
      if (isPureReference || anchorPoints.length) {
        pointsField = {
          ...refGroup,
          name: "locations",
          type: "SELECT",
          fields: undefined,
          label: refGroup.label || "Anchor Point",
        };
        selectionOnly = true;
        sorted[sorted.indexOf(refGroup)] = pointsField;

        anchorDetailFields.push(...directLeaves);
        if (stepType === "COMPLETION") {
          for (const sub of (refGroup.fields ?? []).filter(
            (f) => f.type === "GROUP",
          )) {
            anchorDetailFields.push(...usableLeaves(sub));
          }
        }
        // Insert after the reference so they render as the following screens
        sorted.splice(sorted.indexOf(pointsField) + 1, 0, ...anchorDetailFields);
      }
    }
  }
  // The per-point risk flag renders inside each entry card, not as its own field
  const flagField = pointsField
    ? sorted.find((f) => (f.type === "TOGGLE" || f.type === "BOOLEAN") && normalizeFieldName(f.name) === "FLAG")
    : undefined;
  const setupUpdateNames = new Set(
    [pointsField?.name, flagField?.name].filter((n): n is string => !!n),
  );

  // Solo fields (LOCATION/LOCATION_LIST/IMAGE/GROUP) each still get their
  // own screen, but interleaved with batched runs in the template's own
  // displayOrder — a solo field mid-form no longer jumps ahead of earlier
  // batchable ones (e.g. CH-004's optional trailing receipt IMAGE used to
  // render before its preceding measurement/description fields)
  const knownNameFields: ApiTemplateFormField[] = [];
  const screenGroups: (
    | { kind: "solo"; field: ApiTemplateFormField }
    | { kind: "batch"; fields: ApiTemplateFormField[] }
  )[] = [];
  let currentBatch: ApiTemplateFormField[] = [];
  const flushBatch = () => {
    for (let i = 0; i < currentBatch.length; i += DYNAMIC_BATCH_SIZE) {
      screenGroups.push({ kind: "batch", fields: currentBatch.slice(i, i + DYNAMIC_BATCH_SIZE) });
    }
    currentBatch = [];
  };

  for (const field of sorted) {
    if (setupUpdateNames.has(field.name)) {
      continue;
    } else if (VOLUNTEER_HOURS_NAMES.has(normalizeFieldName(field.name)) || CONTRIBUTORS_NAMES.has(normalizeFieldName(field.name)) || COMPLETION_NAMES.has(normalizeFieldName(field.name))) {
      knownNameFields.push(field);
    } else if (SOLO_TYPES.has(field.type)) {
      flushBatch();
      screenGroups.push({ kind: "solo", field });
    } else {
      currentBatch.push(field);
    }
  }
  flushBatch();

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
      ...(selectionOnly ? { selectionOnly } : {}),
    });
  }

  // 1. Solo and batched fields, in the template's own displayOrder
  for (const group of screenGroups) {
    push({
      kind: "dynamic",
      fields: group.kind === "solo" ? [group.field] : group.fields,
    });
  }

  // 2. Volunteer hours
  const vhField = knownNameFields.find((f) => VOLUNTEER_HOURS_NAMES.has(normalizeFieldName(f.name)));
  if (vhField) push({ kind: "volunteer-hours", fields: [vhField] });

  // 3. Contributors
  const contribField = knownNameFields.find((f) => CONTRIBUTORS_NAMES.has(normalizeFieldName(f.name)));
  if (contribField) push({ kind: "contributors", fields: [contribField] });

  // 4. Completion confirmation
  const completionField = knownNameFields.find((f) => COMPLETION_NAMES.has(normalizeFieldName(f.name)));
  if (completionField) push({ kind: "mark-complete", fields: [completionField] });

  // Always end with review
  steps.push({ kind: "review", fields: [] });

  return { steps, fieldToStepIndex, anchorDetailFields };
}

// ── BE payload shaping ───────────────────────────────────────────────────────
// The Go Data struct is strictly typed and json.Unmarshal fails the WHOLE
// submission on any type mismatch, so values must match the struct's shape:
// NUMBER → Measurement {value, unitOfMeasure}, DATE → RFC3339 timestamp,
// TOGGLE/BOOLEAN → bool. Unknown keys are ignored (safe); wrong types 400.
export function shapeFieldValue(
  field: ApiTemplateFormField,
  val: unknown,
  unit?: string,
): unknown {
  const norm = normalizeFieldName(field.name);

  if (field.type === "NUMBER" || field.type === "NUMERIC") {
    return {
      value: parseFloat(String(val)) || 0,
      ...(unit ? { unitOfMeasure: unit } : {}),
    };
  }
  if (field.type === "DATE") {
    const d = new Date(String(val));
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  if (field.type === "TOGGLE" || field.type === "BOOLEAN") {
    return val === true || val === "true";
  }
  // Data.Report / Data.Receipt are MediaFile structs — a typed-in string
  // travels in the description field (a real File goes out as the multipart
  // mediaFile part instead)
  if ((norm === "REPORT" || norm === "RECEIPT") && typeof val === "string") {
    return { description: val };
  }
  if (field.type === "MULTISELECT" && Array.isArray(val)) {
    // Data.OutreachMethod is a string, Data.AssistanceProvided a bool —
    // an array into either fails the parse
    if (norm === "OUTREACHMETHOD") return val.join(", ");
    if (norm === "ASSISTANCEPROVIDED") return val.length > 0;
    return val;
  }
  return val;
}

// Template names that differ from the Go Data struct json tags
export function toDataKey(name: string, val: unknown): string {
  const norm = normalizeFieldName(name);
  // CH-009: registration's addable "address" persists as data.addresses;
  // the monitoring step's single "address" as data.location
  if (norm === "ADDRESS") return Array.isArray(val) ? "addresses" : "location";
  // BE tag is singular
  if (norm === "COMMUNICATIONCHANNELS") return "communicationChannel";
  return name;
}
