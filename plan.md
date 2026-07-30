# Plan: FE follow-ups from the guardians-api sanity check

**Audience:** a fresh Claude/engineer instance with no prior context.
**Repos:** this one (`guardians-webapp`, branch `staging`, uncommitted working tree) and the sibling backend `../guardians-api` (branch `develop`, read-only reference — do not edit it).

## Background

The BE recently reshaped how challenge templates ship per-anchor-point form
fields (commits around "Grouping data point per anchor point", then
`5df8fc1..1d1c71d`). This session already reworked the FE to handle those
shapes; a sanity check of the FE work against the **latest** BE pull
(`5df8fc1..1d1c71d`: `e596372`, `a6b7649`, `1d1c71d`) found the remaining
issues listed under "Remaining work" below.

Key FE concepts you'll touch:

- `src/features/challenges/lib/deriveWizardConfig.ts` — turns a BE step form
  into wizard screens. `findAnchorReference()` finds the anchor-point
  reference field whatever shape the BE shipped (typeless wrapper, or
  identity-only GROUP); `findAnchorLeaves()` recursively collects the real
  per-visit fields nested under it (any depth, any container type).
  `ANCHOR_POINT_DATA_NAMES` lists data keys that must nest under
  `data.anchorPoint` (Go `AnchorPoint` struct) instead of top-level `data`.
  `normalizeFieldName()` = strip underscores + uppercase; used for all
  name/type matching because BE naming is migrating SCREAMING_SNAKE →
  camelCase with inconsistent casing.
- `src/features/challenges/wizard/steps/SetupUpdateStep.tsx` — "pick a
  registered point, log a reading against it" screen; renders the anchor's
  detail fields inline in the selected point's card via the shared
  `FieldControl` (exported from `DynamicFieldsStep.tsx`). Label size is
  driven by `compactDetailFields` in the repo-root `config.json`.
- `src/features/challenges/screens/LogEvidenceWizard.tsx` — the wizard
  shell: routing (which payload builder + endpoint per step), payload
  builders (`buildAnchorSetupPayload`, `buildSetupUpdatePayload`,
  `buildDynamicPayload`), and view-mode reconstruction (`activityToDynamic`).
- Go structs of record: `../guardians-api/core/models/submission.go`
  (`Data`, `AnchorPoint` — strictly typed; wrong key = silently dropped,
  wrong type = whole submission 400s) and `core/models/template.go` (`Step`).
  Template JSON of record: `../guardians-api/bin/forms/*.json`.

## Already done this session — do NOT redo

- Anchor detail fields render inline per selected point for CH-001/CH-008A/
  CH-007 shapes (`findAnchorReference`/`findAnchorLeaves` + `SetupUpdateStep`
  `detailFields` prop); CH-004's non-tracking wrapper splices flat; CH-008B/
  CH-010 promoted-screens path intentionally untouched.
- `buildSetupUpdatePayload` reads inline values and `__unit` companions from
  `entry.values`; review screen shows one row per filled detail field;
  `activityToDynamic` reconstructs inline values on view/edit.
- Case-insensitive **REGISTRATION** routing in `LogEvidenceWizard.tsx`
  (`isRegistrationStep` + the three `normalizeFieldName(stepMeta.stepType)
  === "REGISTRATION"` gates) — this fixed the critical break where CH-001's
  step 1 went lowercase (`setupAndRegistration` / `registration`) and would
  have routed to the generic evidence path instead of `/challengeSetup`.
- `VULNERABLEFLAG` + `DATECAPTURED` added to `ANCHOR_POINT_DATA_NAMES`.
- Also this session (unrelated to the sanity check, but in the diff):
  CH-001 added to `MULTIPART_CODES`; CH-008B mark-complete = non-blocking
  switch + "Continue" button; setup-required gating on steps after step 1
  (`StepScreen.tsx` + wizard redirect); required-field gating on Next in
  `DynamicFieldsStep`; progress = `challengeSteps.length` denominator +
  clamp at 100 (`calcChallengeProgress` in `src/lib/utils.ts`).

`npx tsc --noEmit` is clean as of handoff.

## Remaining work

### 1. Case-insensitive stepType in `deriveWizardConfig.ts`

BE casing is now inconsistent per template (CH-001 steps 2–3 UPPERCASE,
step 1 lowercase; CH-012 `execution`, CH-013 `registration` lowercase).
Two comparisons still exact-match `"COMPLETION"`:

- the inline-adoption gate: `if (!pointsField && anchorPointTracking && stepType !== "COMPLETION")`
- the nested-GROUP promotion gate: `if (stepType === "COMPLETION")`

Fix: normalize once at the top of `deriveWizardConfig` (e.g.
`const normStepType = normalizeFieldName(stepType)`) and compare against
`"COMPLETION"`. Grep the whole FE for other exact `stepType ===` /
`stepId ===` comparisons while at it (`src/lib/hooks/challenges.ts:159` has
`stepId === "SETUP"` for CH-010 routing — verify CH-010's template casing
before touching it).

### 2. `toDataKey`: map `region` → `location`

Commit `a6b7649` renamed CH-001 step 1's top-level LOCATION field
`location` → `region`. The Go `Data` struct has json tag `location` only —
a payload keyed `region` is silently dropped.

- `buildAnchorSetupPayload` is already safe: it binds the region by
  `f.type === "LOCATION" && !f.addableInput`, not by name, and emits
  `data.location`. So CH-001 step 1 works today.
- The **generic dynamic path** is not safe: a field named `region` passing
  through the extras loop lands as `data.region` → dropped.

Fix in `toDataKey` (`deriveWizardConfig.ts`): `if (norm === "REGION")
return "location";` — but first check no template legitimately has BOTH
`region` and `location` top-level fields in one step (grep
`../guardians-api/bin/forms/`), which would collide.

### 3. Add `HABITATTYPE` to `ANCHOR_POINT_DATA_NAMES`

`submission.go` gained `AnchorPoint.HabitatType` (json `habitatType`) and it
exists **only** on the AnchorPoint struct — sent top-level it's dropped.
CH-013 uses it. One-line addition to the set in `deriveWizardConfig.ts`.

### 4. Mirror `required` / `canComplete` on FE step types

`template.go`'s `Step` now has `Required bool` (json `required`) and
`CanComplete bool` (json `canComplete`). Add both as optional booleans to:

- `ApiTemplateStep` in `src/lib/types/challenges.ts`
- the `challengeSteps` element type in `src/lib/types/circles.ts`
  (`ApiCircleChallenge`)

Verify with a real API response which of the two objects actually carries
them (template steps vs challenge instance steps) before relying on either.

### 5. Gate the standalone "Mark Complete" button on `canComplete`

QA issue: `StepScreen.tsx` shows an "Upload Evidence" link AND a standalone
"Mark Complete" button (`markComplete.mutate` → `PUT
/challenges/{id}/steps`) that lets users complete any step with zero
evidence. The user explicitly decided this must be gated by a **BE-provided
flag**, not FE inference — and `canComplete` is that flag.

Fix in `StepScreen.tsx`: hide (or disable with an explanatory line, matching
the existing `setupRequiredFirst` pattern) the Mark Complete button when
`step.canComplete === false`. Treat `undefined` as "allowed" so older
challenge instances keep current behavior. Depends on task 4.

### 6. Progress: required-only denominator

QA issue: optional steps push progress past 100%. Current
`calcChallengeProgress` (`src/lib/utils.ts`) counts ALL `challengeSteps` and
clamps at 100. With step-level `required` now available: when at least one
step has `required === true`, use required steps only for both numerator
(completed ∧ required) and denominator; otherwise keep current behavior.
Keep the `Math.min(100, …)` clamp regardless (BE data drift). Depends on
task 4. Callers pass the whole challenge object — only the type annotation
inside `calcChallengeProgress` needs the optional `required`.

### 7. Minor field-type gaps (low priority)

- `FieldControl` (`DynamicFieldsStep.tsx`) has no `TIME` branch — CH-012's
  time fields fall through to a plain text input. Add a `type="time"` input
  branch mirroring the DATE branch.
- CH-013's `anchorPoint` is `type: "LOCATION"` with `addableInput: true`,
  `fields: []` — there is no addable-LOCATION control; it currently renders
  as a single LocationPicker. Needs a design decision.
- Multi-entry setup GROUPs (CH-001 step 1 now has a required `mediaFile`
  IMAGE per anchor entry): the multipart transport sends **one** `mediaFile`
  part per submission (`useSubmitRegistration` /`useSubmitEvidence` in
  `src/lib/hooks/challenges.ts`), so only the first entry's photo survives
  (`groupMediaFiles[0]` in `buildAnchorSetupPayload`). Fixing properly needs
  BE agreement on a multi-file contract — raise with BE (Tshaks), don't
  invent one FE-side.

### 8. Raise with BE (no FE code)

- stepType/stepId casing is now inconsistent across and within templates —
  ask whether lowercase-camelCase is the end state; FE normalizes either
  way, but consistency would let others stop guessing.
- Confirm `region` rename intent (task 2) and whether BE will accept/alias
  the `region` key server-side.
- Multi-image-per-submission contract (task 7c).

## Verification

- `npx tsc --noEmit` must stay clean.
- Manual, against dev (`staging.theguardians.world` FE / `api.dev.…` BE):
  1. CH-001: step 1 submits to `/challengeSetup` (watch Network tab —
     multipart with `metadata` part); step 2 shows the point cards with
     temperature/weather/photo/date **inline** in the selected card; submit
     succeeds (no 400) and the payload nests reading under `data.measurement`
     + `data.anchorPoint`; review screen shows a row per filled field;
     re-opening the submission (view mode) shows the entered values.
  2. CH-007 step 2: same inline card behavior (fields live 2 levels deep in
     its template — that's the shape `findAnchorLeaves` recurses for).
  3. CH-008B step 4 and CH-010: unchanged behavior (promoted separate
     screens) — regression check.
  4. After task 5: a step with `canComplete: false` hides the standalone
     Mark Complete; others unchanged.
  5. After task 6: a challenge with optional steps completed never exceeds
     100%, and required-only progress reads sensibly.
- `config.json` (repo root): `compactDetailFields` toggles inline-field
  label size on the setup-update card — for the styling comparison the user
  wanted; leave the key present either way (the import type-checks against
  it).
