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
  // setup-update only: the anchor reference's real per-visit fields,
  // wherever they're nested (CH-001/CH-008A's typeless wrapper, CH-007's
  // identity-field container) — rendered inline in the selected point's
  // card, not as separate screens, since the whole step is "pick a point,
  // log this reading against it"
  detailFields?: ApiTemplateFormField[];
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
const SOLO_TYPES = new Set(["LOCATION", "LOCATION_LIST", "IMAGE", "GROUP", "ITEM"]);

const DYNAMIC_BATCH_SIZE = 4;

// Subfields of an anchor-reference GROUP that describe the registered point
// itself — they come from the setup submission, never re-entered
const ANCHOR_IDENTITY_NAMES = new Set(["ANCHORPOINTNAME", "LOCATION"]);

// Field names that always have their own dedicated slot in the Go Data/
// AnchorPoint struct (e.g. Capacity Measurement `json:"capacity"`) — never
// eligible for the generic single-reading treatment (the point's measurement),
// even when they're the only NUMBER field on the point (CH-008B
// EXECUTION/COMPLETION: capacity is not a stand-in "new reading", it's its
// own report field, same as litresCollected on the TRACKING step; CH-008A
// EXECUTION: waterLevelReading has the same dedicated-field shape).
export const DEDICATED_MEASUREMENT_NAMES = new Set(["CAPACITY", "WATERLEVELREADING"]);

// Usable data-entry subfields of a GROUP: typed, not a nested GROUP, and not
// the registered point's identity
export const usableLeaves = (group: ApiTemplateFormField) =>
  (group.fields ?? [])
    .filter(
      (f) =>
        !!f.type &&
        f.type !== "GROUP" &&
        f.type !== "ITEM" &&
        !ANCHOR_IDENTITY_NAMES.has(normalizeFieldName(f.name)),
    )
    .sort((a, b) => a.displayOrder - b.displayOrder);

// BE sometimes ships the anchor-point reference as a typeless wrapper
// instead of a properly-typed GROUP field — either
//   { anchorPoint: { name, location, fields: [...] }, displayOrder }
//   (CH-001 BASELINE_OBSERVATION, CH-008A WATER_LEVEL_OBSERVATION), or
//   { name: "anchorPoint", fields: [...] } with no "type"
//   (CH-004's composting log — reuses the "anchorPoint" key purely for BE
//   payload shaping, unrelated to point selection)
// Pull out the nested fields either way so callers can decide how to use
// them; returns null for an already-typed field (nothing to unwrap).
function unwrapAnchorFields(f: ApiTemplateFormField): ApiTemplateFormField[] | null {
  if (f.type) return null;
  return f.anchorPoint?.fields ?? f.fields ?? null;
}

// A non-addable GROUP/ITEM that isn't the anchor reference is a *display*
// container: the BE regrouped fields that used to sit flat at the top of a
// step into one labelled card (CH-004/CH-008B/CH-011/CH-014/CH-016's
// "siteMetadata", CH-015's "area"). The card is kept — that grouping is the
// point of the change — but it is presentation only. The Go structs never
// grew a matching nested type: `siteMetadata` exists solely on
// models.AnchorPoint (declared, never read), `area` on neither, while the
// leaves have their own DataEnvelope slots and are what the impact
// calculation actually consumes. So the container renders as one card and is
// spread back to top-level keys at payload time — see spreadContainerEntry.
export function isDisplayContainer(f: ApiTemplateFormField): boolean {
  return (
    (f.type === "GROUP" || f.type === "ITEM") &&
    !f.addableInput &&
    normalizeFieldName(f.name) !== "ANCHORPOINT" &&
    !!f.fields?.length
  );
}

// volunteerHours and contributors are wizard infrastructure, not ordinary
// form fields: they drive vhFieldName/contribFieldName, their own screens and
// the top-level payload envelope. A container that swallows one takes the
// whole mechanism with it — CH-004's holds both, which left its step 2 with
// no way to collect either and submitting volunteerHours: 0. Lift those two
// out to the top level (where every other template puts them) and leave the
// rest of the card intact; a container with nothing else left disappears.
//
// A completion flag is deliberately NOT lifted. It would also work top-level,
// but promoting it turns the card's toggle into a mark-complete screen and so
// changes when the step marks itself complete (CH-008B step 2's "confirm") —
// a workflow change, where this is only meant to stop data being dropped. Its
// value still reaches the payload flat, like every other leaf.
function liftKnownNamesFromContainers(
  fields: ApiTemplateFormField[],
): ApiTemplateFormField[] {
  return fields.flatMap((f) => {
    if (!isDisplayContainer(f)) return [f];
    const leaves = [...(f.fields ?? [])].sort(
      (a, b) => a.displayOrder - b.displayOrder,
    );
    const isKnown = (sub: ApiTemplateFormField) => {
      const norm = normalizeFieldName(sub.name);
      return VOLUNTEER_HOURS_NAMES.has(norm) || CONTRIBUTORS_NAMES.has(norm);
    };
    const lifted = leaves.filter(isKnown);
    if (!lifted.length) return [f];
    const rest = leaves.filter((sub) => !isKnown(sub));
    // Lifted fields keep their own displayOrder-derived position relative to
    // the container; the known-name screens are ordered by kind further down
    // anyway, so only the container's own slot has to stay stable.
    return [
      ...(rest.length ? [{ ...f, fields: rest }] : []),
      ...lifted.map((sub, i) => ({
        ...sub,
        displayOrder: f.displayOrder + (i + 1) / (lifted.length + 1),
      })),
    ];
  });
}

// Flattens the "container, not a value" shapes into ordinary top-level fields
// — the typeless wrapper (unwrapAnchorFields) and a typed LOCATION field
// carrying nested fields (CH-016's "Choose site location": a real value to
// capture AND a data container, so it's kept — stripped of `fields` so it
// renders as a plain location picker — with its nested fields spliced in
// alongside it, rather than losing them the way a FieldControl LOCATION
// render otherwise would). No-op on a tracking step, where the wrapper/
// reference is handled later once anchorPoints is known.
// A display container is NOT flattened here (it stays one card); only the
// wizard's known-name fields are lifted out of it, on every step.
// Exported so buildDynamicPayload/buildSetupUpdatePayload can apply the
// identical transform to the raw stepForm before collecting values —
// otherwise rendering and payload collection disagree on which fields exist,
// and a field the user filled in is silently dropped on submit.
export function preNormalizeAnchorFields(
  fields: ApiTemplateFormField[],
  anchorPointTracking?: boolean,
): ApiTemplateFormField[] {
  const lifted = liftKnownNamesFromContainers(fields);
  if (anchorPointTracking) return lifted;
  return lifted.flatMap((f) => {
    const unwrapped = unwrapAnchorFields(f);
    if (unwrapped) return unwrapped;
    if (f.type === "LOCATION" && f.fields?.length) {
      return [{ ...f, fields: undefined }, ...f.fields];
    }
    return [f];
  });
}

// The names preNormalizeAnchorFields lifted out of a typeless "anchorPoint"
// wrapper. Rendering needs them flat (they're ordinary wizard fields), but the
// payload has to put them back inside the point — the template nested them, so
// that's where they belong. Only the wrapper case is reported: the
// LOCATION-with-nested-fields splice above is a genuine top-level location
// (CH-016's "Choose site location"), not an anchor container.
export function anchorWrappedNames(
  fields: ApiTemplateFormField[],
  anchorPointTracking?: boolean,
): Set<string> {
  const names = new Set<string>();
  if (anchorPointTracking) return names;
  for (const f of fields) {
    for (const nested of unwrapAnchorFields(f) ?? []) {
      if (nested.name) names.add(nested.name);
    }
  }
  return names;
}

// The real per-visit data fields under an anchor reference can be nested at
// any depth, in a container of any (or no) declared type — CH-001/CH-008A
// wrap them in a typeless field, CH-008B nests a proper GROUP inside a
// GROUP, CH-007 nests them inside a plain TEXT field ("anchorPointName")
// that's everywhere else treated as the point's identity. Rather than a
// branch per shape: a field with its own nested fields is a container to
// descend into, whatever its own type is; a field with none is a real leaf,
// unless it's the point's identity (never re-entered, see
// ANCHOR_IDENTITY_NAMES) or has no type and nothing nested (nothing usable).
export function findAnchorLeaves(container: ApiTemplateFormField): ApiTemplateFormField[] {
  const subFields = container.fields ?? container.anchorPoint?.fields ?? [];
  return subFields
    .flatMap((f) => {
      const nested = f.fields ?? f.anchorPoint?.fields;
      if (nested?.length) return findAnchorLeaves(f);
      if (ANCHOR_IDENTITY_NAMES.has(normalizeFieldName(f.name))) return [];
      if (!f.type) return [];
      return [f];
    })
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

// The anchor reference in a step's form, whatever shape the BE shipped it
// in: a typeless wrapper (CH-008A), a non-addable GROUP named "anchorPoint"
// (or "anchorPointName" — CH-001's flattened shape) whose only direct
// subfields are identity (CH-007), OR — on a step flagged
// anchorPointTracking (select a point, log this reading against it) — a
// non-addable GROUP whose direct subfields ARE the real per-visit data
// (CH-001/CH-002/CH-008B: temperature/capacity/etc. live right on it, not
// nested under an identity-only wrapper). Off-tracking steps still require
// zero direct leaves, so a data-bearing GROUP outside a tracking step (e.g.
// CH-010's SETUP/OUTREACH) is left to the promote-to-screens branch instead.
export function findAnchorReference(
  fields: ApiTemplateFormField[],
  anchorPointTracking?: boolean,
): ApiTemplateFormField | undefined {
  return fields.find(
    (f) =>
      !f.type ||
      (f.type === "GROUP" &&
        !f.addableInput &&
        (normalizeFieldName(f.name) === "ANCHORPOINT" ||
          normalizeFieldName(f.name) === "ANCHORPOINTNAME") &&
        (usableLeaves(f).length === 0 || anchorPointTracking === true)) ||
      // CH-009's heatwaveMonitoring ships its tracking reference as a typed
      // LOCATION carrying nested per-visit fields (visitDate, checkinCount,
      // …) instead of a GROUP — same shape as the GROUP tracking case, just
      // a different container type. Only matches on a tracking step: an
      // untracked LOCATION+nested-fields field (CH-016's firstPlanting) is a
      // different idiom (a fresh per-submission location, not a point
      // picker) and must not be swallowed here.
      (f.type === "LOCATION" &&
        !f.addableInput &&
        anchorPointTracking === true &&
        normalizeFieldName(f.name) === "ANCHORPOINT" &&
        (f.fields?.length ?? 0) > 0),
  );
}

export function deriveWizardConfig(
  fields: ApiTemplateFormField[],
  setupData?: SetupUpdateSource,
  // Template stepType of the step being derived (EXECUTION, COMPLETION, …) —
  // gates whether a placeholder's nested per-anchor fields are promoted
  stepType?: string,
  // Step-level flag: this step's fields are per-registered-anchor-point
  // data entry (select a point, then log against it) — see
  // unwrapAnchorFields for the two wrapper shapes this affects
  anchorPointTracking?: boolean,
): DerivedWizardConfig {
  // BE casing is inconsistent per template (CH-001 steps 2-3 UPPERCASE,
  // step 1 lowercase; CH-012 "execution", CH-013 "registration" lowercase)
  // — normalize once so the COMPLETION gates below match regardless
  const normStepType = normalizeFieldName(stepType);

  // Non-tracking steps (e.g. CH-004) reuse the "anchorPoint" wrapper purely
  // for BE payload shaping, unrelated to point selection — splice its
  // nested fields in flat so they render (and submit) like any other field.
  // Tracking steps are handled below, once anchorPoints is known, so their
  // nested fields render inline per selected point instead.
  const preNormalized = preNormalizeAnchorFields(fields, anchorPointTracking);

  const sorted = [...preNormalized].sort((a, b) => a.displayOrder - b.displayOrder);

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

  // A tracking, non-completion step (CH-001, CH-002, CH-007, CH-008B) whose
  // reference is either the typeless wrapper, a typed GROUP with no *direct*
  // usable leaves of its own (CH-007's anchorPoint → only anchorPointName,
  // which is identity — the real fields are one level further in), or —
  // because the step is anchorPointTracking — a typed GROUP whose direct
  // leaves ARE the real per-visit data (CH-001/CH-002/CH-008B): adopt as the
  // points field, and its fields — found via findAnchorLeaves, wherever they
  // actually live — render inline in the selected point's card
  // (SetupUpdateStep), not as separate screens.
  let wrapperDetailFields: ApiTemplateFormField[] | undefined;
  if (!pointsField && anchorPointTracking && normStepType !== "COMPLETION") {
    const ref = findAnchorReference(sorted, anchorPointTracking);
    if (ref) {
      wrapperDetailFields = findAnchorLeaves(ref);
      pointsField = {
        name: "locations",
        type: "SELECT",
        label: ref.label || ref.anchorPoint?.label || "Observation Points",
        required: false,
        displayOrder: ref.displayOrder,
      };
      sorted[sorted.indexOf(ref)] = pointsField;
    }
  }

  // Fallback (CH-008B's ANCHOR_POINT_NAME): the BE ships the anchor-points
  // reference as a degenerate, all-blank, named-but-type-less field. When
  // registered points exist, adopt it as the points field so the step still
  // renders the CH-001-style update screen. Adopted under the name
  // "locations" so payload/view-mode keys stay consistent.
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

  // Non-tracking templates (CH-010 SETUP/OUTREACH) ship the reference as a
  // non-addable GROUP named "anchorPoint": select one of the registered
  // points. Its shape varies —
  //   • no usable leaves (empty / nested placeholder GROUP / location only):
  //     pure reference, adopt even before any points exist so the placeholder
  //     never renders as a form
  //   • usable leaves (CH-010 SETUP: shadeType, setupDate, …): per-anchor data
  //     entry — adopt only when registered points exist, and promote the
  //     leaves to regular dynamic fields
  // A placeholder's *nested* GROUP carries the intended per-anchor fields;
  // promote those only on COMPLETION steps. Tracking steps (CH-001/CH-002/
  // CH-008B) never reach this branch — the findAnchorReference branch above
  // already claims them and renders their fields inline instead.
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
        if (normStepType === "COMPLETION") {
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
    } else if (
      VOLUNTEER_HOURS_NAMES.has(normalizeFieldName(field.name)) ||
      // A field named "contributors" is always the platform-user picker
      // (ContributorsStep) regardless of its declared type — BE templates
      // uniformly type it TEXT (never MULTISELECT), matching-by-name only
      // has always been correct here. (2026-08-02: briefly gated this to
      // MULTISELECT after a crash traced to a raw string reaching
      // ContributorsList's ids.map — reverted per Tshaks/product, since that
      // broke the already-established picker UI on every challenge. The
      // crash is fixed defensively at the array-consumption sites instead —
      // see ContributorsList's Array.isArray guard in ReviewStep.tsx.)
      CONTRIBUTORS_NAMES.has(normalizeFieldName(field.name)) ||
      COMPLETION_NAMES.has(normalizeFieldName(field.name))
    ) {
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
      ...(wrapperDetailFields ? { detailFields: wrapperDetailFields } : {}),
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

// ── Display containers: one card in, flat keys out ───────────────────────────
// The card is a rendering decision (see isDisplayContainer); the payload has
// to be flat, because the container name has no Data slot and every leaf does.
// Rather than special-casing inside each builder's GROUP branch, both the
// field list and the collected values are flattened up front, so all the
// existing per-field shaping runs unchanged on the leaves.

// Fields with each display container replaced by its leaves, in place.
export function flattenContainersForPayload(
  fields: ApiTemplateFormField[],
): ApiTemplateFormField[] {
  return fields.flatMap((f) =>
    isDisplayContainer(f)
      ? [...(f.fields ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)
      : [f],
  );
}

// Values with each display container's single entry spread to the top level
// (its `<name>__unit` companions included). A non-addable container renders as
// exactly one entry, so entry[0] is the whole card. An existing top-level key
// always wins — a leaf must never overwrite a real field of the same name.
export function hoistContainerValues(
  fields: ApiTemplateFormField[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const hoisted: Record<string, unknown> = { ...values };
  for (const f of fields) {
    if (!isDisplayContainer(f)) continue;
    const raw = values[f.name];
    const entry = Array.isArray(raw)
      ? (raw[0] as Record<string, unknown> | undefined)
      : undefined;
    delete hoisted[f.name];
    if (!entry) continue;
    for (const [k, v] of Object.entries(entry)) {
      if (!(k in hoisted)) hoisted[k] = v;
    }
  }
  return hoisted;
}

// The reverse, for view mode: the BE stores the leaves flat, but the card
// reads one entry under the container's own name — without this a submitted
// record reopens with an empty card.
export function nestContainerValues(
  fields: ApiTemplateFormField[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const nested: Record<string, unknown> = { ...values };
  for (const f of fields) {
    if (!isDisplayContainer(f)) continue;
    const entry: Record<string, unknown> = {};
    for (const sub of f.fields ?? []) {
      for (const key of [sub.name, `${sub.name}__unit`]) {
        if (key in nested) {
          entry[key] = nested[key];
          delete nested[key];
        }
      }
    }
    if (Object.keys(entry).length) nested[f.name] = [entry];
  }
  return nested;
}

// Template names that differ from the Go Data struct json tags
export function toDataKey(name: string, val: unknown): string {
  const norm = normalizeFieldName(name);
  // CH-009: registration's addable "address" persists as data.addresses;
  // the monitoring step's single "address" as data.location
  if (norm === "ADDRESS") return Array.isArray(val) ? "addresses" : "location";
  // Data.AnchorPoints is always an array on the BE — an addable LOCATION
  // named "anchorPoint" (CH-013) already builds one, just under the
  // singular key; only the key needs renaming here (GROUP-typed
  // anchorPoint and the plain single-LOCATION case are handled directly
  // in LogEvidenceWizard's buildDynamicPayload, which never reaches this
  // function for those fields).
  if (norm === "ANCHORPOINT") return "anchorPoints";
  // BE tag is singular
  if (norm === "COMMUNICATIONCHANNELS") return "communicationChannel";
  return name;
}

// Stamps a fresh mediaFileReferenceId onto a Region/Location/AnchorPoint
// object (BE commit fbdb11e) so a photo uploaded alongside it can be matched
// back to this entry — never mutates the source object (it's live form state)
export function withMediaFileReferenceId<T extends object>(
  obj: T,
): T & { mediaFileReferenceId: string } {
  return { ...obj, mediaFileReferenceId: crypto.randomUUID() };
}
