# Challenge Setup & Setup-Update Flow — Developer Guide

## Overview

Some challenges follow a **register-then-re-measure** pattern. CH-001 (Heat Spot
Mapping) is the first: step 1 registers a fixed set of *anchor points* (name +
location + baseline temperature), and every later observation step re-measures
those same points over time. Points are never added or removed after setup —
the value of the challenge is the time series per point.

The flow has three parts, all challenge-agnostic except where noted:

1. **Setup submission** — the registration step posts to `/challengeSetup` as
   multipart form-data (`metadata` JSON part + `mediaFile` part).
2. **`submittedSetupDetail`** — on success the BE attaches the accepted setup
   data to the challenge object. This is the source of truth for what was
   registered.
3. **Setup-update screen** — later steps detect the registered points and
   render them as a fixed selection list: the user picks **one** point and
   records its new measurement (and risk flag). One submission = one
   observation of one point, posted multipart to the challenge's evidence
   endpoint. Users repeat the step over time to build the series.

This document covers all three. For the wizard engine itself (modes, static
configs, drafts, view mode) see [EVIDENCE_WIZARD.md](./EVIDENCE_WIZARD.md).

---

## File Map

```
src/lib/
  types/challenges.ts               ← ChallengeSetupLocation / ChallengeSetupAnchorPoint /
                                       ApiSubmittedSetupDetail
  types/circles.ts                  ← ApiCircleChallenge.submittedSetupDetail
  hooks/challenges.ts               ← CH001SetupPayload, useSubmitRegistration (multipart),
                                       useSubmitEvidence (multipart option)
src/features/challenges/
  lib/deriveWizardConfig.ts         ← "setup-update" step kind + trigger rules
  wizard/steps/SetupUpdateStep.tsx  ← fixed-list re-measure UI
  wizard/steps/ReviewStep.tsx       ← DynamicReviewConfig.setupUpdate rows
  screens/LogEvidenceWizard.tsx     ← buildCH001SetupPayload, buildSetupUpdatePayload,
                                       submit() routing
```

---

## Part 1 — Setup Submission (`/challengeSetup`)

### When it triggers

In `submit()` (dynamic path), gated per challenge:

```ts
if (challenge.challengeCode === "CH-001" && isRegistrationStep) {
  const { payload, mediaFile } = buildCH001SetupPayload();
  submitRegistration.mutate({ ..., payload, mediaFile });
}
```

> Gating by `challengeCode` is deliberate — the shared dynamic path that CH-004
> and others use must not change shape. New challenges that need a bespoke
> setup payload get their own gate + builder.

### Transport

`useSubmitRegistration` → `POST /challengeSetup` as **multipart form-data**:

| Part | Content |
|---|---|
| `metadata` | The payload, `JSON.stringify`'d |
| `mediaFile` | The first `IMAGE` field's `File`, if any |

`apiFetch` detects a `FormData` body and lets the browser set the
`multipart/form-data` boundary header. The console log prints form parts under
`formDataParts` — the wire format is *not* JSON even though the log looks like it.

### Payload shape (`CH001SetupPayload`)

Built by `buildCH001SetupPayload()` from the dynamic form values:

```jsonc
{
  "stepId": "SETUP_AND_REGISTRATION",
  "stepNumber": 1,
  "stepType": "REGISTRATION",
  "challengeCode": "CH-001",
  "challengeId": "5B738F6",
  "thingId": "5B738F6",
  "circleId": "46FBE82",
  "submittedBy": "<user uuid>",
  "volunteerHours": { "value": 8, "unitOfMeasure": "hours", "siUnit": "TIME" },
  "contributors": ["<user uuid>"],
  "data": {
    "volunteerHours": { "value": 8, "unitOfMeasure": "hours", "siUnit": "TIME" },
    "weatherCondition": "Cloudy",          // only if a WEATHER* field is filled
    "location": { /* LocationResult */ },  // the step's top-level LOCATION field
    "anchorPoints": [
      {
        "name": "Yellow Spot",
        "location": { "placeId": "...", "latitude": 0, /* … camelCase */ },
        "measurement": { "value": 55, "unitOfMeasure": "°C" }
      }
    ]
  }
}
```

Mapping rules in the builder:

- The `ANCHOR_POINT` GROUP entries map to `anchorPoints[]`: the first `TEXT`
  sub-field → `name`, the `LOCATION` sub-field → `location` (a
  `LocationResult` passes through unchanged — it already has the exact
  camelCase keys the BE wants), the `NUMBER` sub-field → `measurement`.
- Temperature units map to symbols: `C → °C`, `F → °F`, `K → K`.
- Fully empty group entries are dropped; name-only entries are kept.
- `volunteerHours` appears both top-level and inside `data`, `siUnit`
  lowercase-s only (no `SiUnit` duplicate).

---

## Part 2 — `submittedSetupDetail`

After a successful setup submission the challenge object
(`GET /challenges/{id}`) carries the accepted data:

```jsonc
"submittedSetupDetail": {
  "stepId": "SETUP_AND_REGISTRATION",
  "stepNumber": 1,
  "data": {
    "mediaFiles": [{ "type": "image/webp", "url": "…", "description": "" }],
    "anchorPoints": [
      {
        "name": "Point 1",
        "location": { "placeId": "…", /* … */ },
        "higherRiskFlag": false,
        "measurement": { "value": 2, "unitOfMeasure": "°C" }
      }
    ],
    "location": { /* … */ },
    "volunteerHours": { /* … */ }
  },
  "status": { "code": "CONFIRMED", /* … */ }
}
```

Typed as `ApiSubmittedSetupDetail` in `src/lib/types/challenges.ts`, attached
to `ApiCircleChallenge`.

**Identity:** anchor points have no dedicated ID — `location.placeId` (plus
`name`) is the stable identity. This is why update submissions must resend the
`location` object untouched.

---

## Part 3 — Setup-Update Screen

### Trigger rules (`deriveWizardConfig`)

`deriveWizardConfig(fields, setupData?)` receives the setup data as a second
argument. The wizard shell passes `challenge.submittedSetupDetail.data` for
every step **except** the setup step itself:

```ts
const setupData =
  setupDetail && stepMeta && setupDetail.stepId !== stepMeta.stepId
    ? setupDetail.data
    : undefined;
```

Inside `deriveWizardConfig`, a `setup-update` step is emitted when **both**:

1. `setupData.anchorPoints` is non-empty, and
2. the step's form has a `SELECT` field named `locations` (case-insensitive).
   This SELECT is the BE's reference to "the points registered during setup" —
   its hardcoded options are placeholders and are ignored.

When triggered:

- The `locations` SELECT is consumed and replaced by the `setup-update` screen
  (rendered **first**, before all other screens — it is the heart of the step).
- A `TOGGLE`/`BOOLEAN` field named `FLAG` is also consumed: it renders *inside
  each point card* (per-point `higherRiskFlag`), not as its own field.
- All other form fields (weather, volunteer hours, image, contributors…) flow
  through the normal derived-mode screens unchanged.

Challenges without `submittedSetupDetail` are completely unaffected — the
`locations` SELECT renders as a plain select like before.

### UI (`SetupUpdateStep`)

A radio-style selection list, one card per registered point, fixed set (no add
/ no remove / no rename — identity must survive the round-trip). Selecting a
card expands it:

- **Read-only identity**: point name (title) + formatted address.
- **New reading**: number input, unit suffix taken from the point's previous
  `measurement.unitOfMeasure`. Starts **empty** — this records a new
  observation; the previous value shows underneath as
  `Last reading: 2 °C` (i18n keys `newReading` / `lastReading`).
- **Risk flag**: `ToggleCard` inside the expanded card when the form has a
  `FLAG` field, initialised from the point's previous `higherRiskFlag`.

Selecting a different point resets the reading (a measurement belongs to one
point).

### Value model

User input lives in `dynamicValues[pointsField.name]` (i.e. `"locations"`) as
a single entry:

```ts
type SetupUpdateEntry = {
  selected: string;        // the chosen point's name (points have no id)
  measurement: string;
  higherRiskFlag: boolean;
};
```

Plain strings/booleans → localStorage draft persistence works automatically
(see EVIDENCE_WIZARD.md → localStorage Draft).

### Review

`ReviewStep` receives `dynamicConfig.setupUpdate` — a pre-formatted row for the
selected point (`"Point 1 · 58 Cecil Awret Rd … · 4 °C"`) with the step index
for edit navigation. The consumed fields (`locations`, `FLAG`) are filtered out
of `dynamicConfig.fields` so they don't double-render.

### Submission

In `submit()` (dynamic path), *after* the CH-001 registration gate and *before*
the generic dynamic path:

```ts
if (setupUpdateStep) {
  const { payload, mediaFile } = buildSetupUpdatePayload(setupUpdateStep);
  submitEvidence.mutate({ ..., payload, mediaFile, multipart: true });
}
```

`useSubmitEvidence` with `multipart: true` posts to the same evidence endpoint
(`/submit{CODE}`, e.g. `/submitCH001`) but as `metadata` + `mediaFile` form
parts instead of a JSON body.

`buildSetupUpdatePayload()` emits one observation
(`SetupUpdateEvidencePayload`):

```jsonc
{
  "stepId": "BASELINE_OBSERVATION",
  "stepNumber": 2,
  "stepType": "EXECUTION",
  // …same top-level envelope as the setup payload…
  "data": {
    "anchorPoint": {                       // singular — the selected point
      "name": "Point 1",
      "location": { "placeId": "…", /* passed through unchanged */ },
      "higherRiskFlag": false              // from the card's toggle
    },
    "capturedAt": "2026-07-06T12:34:56.000Z",  // set at submit time
    "measurement": { "value": 4, "unitOfMeasure": "°C" },
    "volunteerHours": { "value": 2, "unitOfMeasure": "hours", "siUnit": "TIME" },
    "weatherCondition": "Cloudy"           // only if a WEATHER* field is filled
  }
}
```

- `anchorPoint.name` / `location` come from `submittedSetupDetail`
  **unchanged** — `placeId` (+ name) is the identity the BE matches on.
- `measurement.unitOfMeasure` is inherited from the point's previous
  measurement.
- `weatherCondition`, `volunteerHours`, `contributors`, `mediaFile`: from the
  step's own form fields, same rules as the setup builder.
- The builder throws if no point is selected.

---

## Adding This Pattern to Another Challenge

Nothing FE-side is CH-001-specific in the update flow. A new challenge gets the
setup-update behaviour automatically when the BE provides:

1. **A setup submission** that results in `submittedSetupDetail.data.anchorPoints`
   on the challenge (whatever endpoint/shape the setup step itself uses).
2. **A later step form** containing a `SELECT` named `locations`
   (+ optionally a `TOGGLE` named `FLAG` for the per-point risk flag).

What *is* challenge-specific is the setup submission itself (Part 1): if the
new challenge's registration payload differs from the shared dynamic shape, add
a `challengeCode` gate + builder in `submit()` next to the CH-001 one — never
reshape the shared dynamic path.

### Extending the per-observation editable fields

Today the editable surface is one measurement + one flag. If a challenge needs
more per-observation inputs, extend:

- `SetupUpdateEntry` (the value model),
- `SetupUpdateStep` (render the extra inputs in the expanded card),
- `SetupUpdateEvidencePayload` + `buildSetupUpdatePayload()` (map them into
  `data`).

Keep name/location read-only — identity must survive the round-trip.

---

## Types Reference

| Type | Where | Purpose |
|---|---|---|
| `ChallengeSetupLocation` | `types/challenges.ts` | camelCase location (same keys as `LocationResult`) |
| `ChallengeSetupAnchorPoint` | `types/challenges.ts` | `{ name, location?, higherRiskFlag?, measurement? }` |
| `ApiSubmittedSetupDetail` | `types/challenges.ts` | BE-attached setup submission on the challenge |
| `CH001SetupPayload` | `hooks/challenges.ts` | metadata shape for the setup submission |
| `SetupUpdateEvidencePayload` | `hooks/challenges.ts` | metadata shape for one observation (setup-update) |
| `SetupUpdateSource` | `lib/deriveWizardConfig.ts` | the `setupData` argument (`{ anchorPoints? }`) |
| `SetupUpdateEntry` | `wizard/steps/SetupUpdateStep.tsx` | user input `{ selected, measurement, higherRiskFlag }` |

---

## Known Gaps / Watch-outs

- **View mode**: setup-update steps have no view-mode hydration yet (same
  limitation as other derived steps — see EVIDENCE_WIZARD.md → View Mode).
- **BE anchor matching**: unconfirmed whether the BE matches updates by
  `placeId`/`name` or stores each submission as a snapshot. FE resends
  identity untouched either way.
- **`data.location` on setup**: the Postman contract sample omits it; we send
  the step's required LOCATION field anyway. Drop it if the BE ever rejects
  unknown keys.
- **All-payloads-multipart migration**: the BE plans to move *all* evidence
  submissions to `metadata` + `mediaFile` form parts. When that lands, flip the
  remaining JSON paths in `useSubmitEvidence` / `useUpdateEvidence` to the
  `multipart: true` branch.
