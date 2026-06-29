# Evidence Wizard — Developer Guide

## Overview

`LogEvidenceWizard` is the single wizard engine for all challenge step submissions.
It runs in two modes depending on whether the step has BE-supplied form fields:

- **Derived mode** — the step's `form` field (from `challengeSteps` or `templateStep`)
  is non-empty. `deriveWizardConfig()` converts the flat field list into a
  `DerivedWizardConfig` and renders screens dynamically. No FE config entry needed.
- **Static mode** — `form` is null/empty. A `FormConfig` in `STEP_FORM_CONFIGS` (keyed
  by `stepId`) drives a fixed sequence of hand-crafted step components.

The wizard shell manages state, localStorage drafts, auto-marking steps complete, and
API submission. All form UI lives in isolated step components.

---

## File Structure

```
src/features/challenges/
  stepFormConfig.ts             ← static step registry (FE fallback)
  lib/
    deriveWizardConfig.ts       ← converts BE form fields → DerivedWizardConfig
  wizard/
    types.ts                    ← LogFormData type + initForm()
    shared.tsx                  ← reusable UI primitives
    steps/
      SiteDetailsStep.tsx
      LocationPhotosStep.tsx
      SiteConditionStep.tsx
      InterventionsStep.tsx
      MetricsStep.tsx
      FileUploadStep.tsx
      ImpactStep.tsx
      MeasurementStep.tsx
      VolunteerHoursStep.tsx
      RegionStep.tsx
      ContributorsStep.tsx
      MarkCompleteStep.tsx
      ReviewStep.tsx
      DynamicFieldsStep.tsx     ← renders any ApiTemplateFormField[]
  screens/
    LogEvidenceWizard.tsx       ← shell (~600 lines)
```

---

## Mode Resolution

```ts
// stepForm: non-null fields from challengeSteps or templateStep
const stepForm = (stepMeta?.form?.length ? stepMeta.form : null) ?? templateStep?.form ?? null;

const isDerived = !!(stepForm?.length);
// true  → DerivedWizardConfig from deriveWizardConfig(stepForm)
// false → FormConfig from STEP_FORM_CONFIGS[stepId] ?? DEFAULT_FORM_CONFIG
```

---

## Derived Mode — `deriveWizardConfig`

`src/features/challenges/lib/deriveWizardConfig.ts`

Takes the flat `ApiTemplateFormField[]` from the BE and sorts them into a
`DerivedWizardConfig` with `steps: DerivedStep[]`.

### Field classification

| Field name(s) | Step kind |
|---|---|
| `VOLUNTEER_HOURS`, `VOLUNTEERS_HOURS` | `volunteer-hours` |
| `CONTRIBUTORS` | `contributors` |
| `CONFIRM_COMPLETION`, `CONFIRMATION` | `mark-complete` |
| Fields of type `LOCATION`, `LOCATION_LIST`, `IMAGE` | `dynamic` (one field per screen) |
| Everything else | `dynamic` (batched up to 4 per screen) |

### Step ordering

1. Solo fields (LOCATION / LOCATION_LIST / IMAGE) — one screen each
2. Simple batchable fields — up to 4 per screen (`DYNAMIC_BATCH_SIZE = 4`)
3. `volunteer-hours` screen (if the field exists)
4. `contributors` screen (if the field exists)
5. `mark-complete` screen (if `CONFIRM_COMPLETION` / `CONFIRMATION` exists)
6. `review` screen (always appended)

### DerivedStepKind values

| kind | What renders |
|---|---|
| `dynamic` | `DynamicFieldsStep` with the step's `fields` array |
| `volunteer-hours` | `VolunteerHoursStep` (bridged from `dynamicValues`) |
| `contributors` | `ContributorsStep` (bridged from `dynamicValues`) |
| `mark-complete` | `MarkCompleteStep` → calls `submit()` directly |
| `review` | `ReviewStep` with `dynamicConfig` prop |

---

## Static Mode — `STEP_FORM_CONFIGS`

`src/features/challenges/stepFormConfig.ts`

FE fallback when no BE form fields exist. Key is the `stepId`.

```ts
export const STEP_FORM_CONFIGS: Record<string, FormConfig> = {
  SETUP_AND_REGISTRATION: {
    wizardSteps: [
      { type: "measurement" },
      { type: "region" },
      { type: "volunteer-hours" },
      { type: "contributors" },
      { type: "file-upload" },
      { type: "review" },
    ],
  },
  // ...
};

export const DEFAULT_FORM_CONFIG: FormConfig = {
  wizardSteps: [
    { type: "file-upload" },
    { type: "volunteer-hours" },
    { type: "impact" },
    { type: "contributors" },
    { type: "review" },
  ],
};
```

Available `WizardStepType` values:

| type | What it renders |
|---|---|
| `site-details` | Site name, permission holder, written permission toggle |
| `location-photos` | Location picker, OSM map, coordinates, photo uploads |
| `site-condition` | Site area, condition textarea, surface type dropdowns |
| `interventions` | Planting/intervention rows with species + count |
| `metrics` | Read-only computed impact metrics |
| `file-upload` | File drop zone + uploaded file list (images, PDFs, CSVs) |
| `impact` | Impact description textarea |
| `measurement` | Measurement value + unit selector |
| `volunteer-hours` | Hours input |
| `region` | Standalone location/region search |
| `contributors` | Member search/chips — who performed the action |
| `mark-complete` | Confirmation button — submits directly, no review |
| `review` | Read-only summary + Upload/Delete buttons |

> `review` is the last step before success. `mark-complete` submits directly and
> still auto-fires mark-complete on the step (see below).

### Adding a new static step template

Add an entry to `STEP_FORM_CONFIGS`:

```ts
MY_NEW_STEP_ID: {
  wizardSteps: [
    { type: "file-upload" },
    { type: "impact" },
    { type: "contributors" },
    { type: "review" },
  ],
},
```

---

## Form State

Two parallel state objects live in the shell:

| State | Used by |
|---|---|
| `form: LogFormData` | Static steps — hand-crafted components read/write this |
| `dynamicValues: DynamicValues` (`Record<string, unknown>`) | Derived steps — `DynamicFieldsStep` and bridge |

### Derived bridge

`VolunteerHoursStep` and `ContributorsStep` speak `LogFormData`. In derived mode
they receive a `bridgeForm` (built from `dynamicValues`) and an `updateBridge`
adapter that writes back to `dynamicValues` using the actual field names
(`VOLUNTEER_HOURS`, `CONTRIBUTORS`) detected from `derivedConfig`.

---

## Submission

Three payload builders, one per path:

| Function | Used when |
|---|---|
| `buildDynamicPayload()` | `isDerived === true` — sends `data.fields` map to `submitEvidence` |
| `buildRegistrationPayload()` | `stepId === "SETUP_AND_REGISTRATION"` |
| `buildPayload()` | All other static steps |

Edit flows (when `viewId` is set and `isViewMode` is false) call `useUpdateEvidence`
(`PUT /evidences/{id}`) instead of `useSubmitEvidence`. This currently applies to
the static path only — the derived path always creates new evidence.

### Auto mark-complete

If the wizard config contains a `mark-complete` step, the shell fires
`useMarkStepComplete` as fire-and-forget inside `onSuccess` after evidence is
accepted. The `shouldMarkComplete` flag is computed synchronously:

```ts
const shouldMarkComplete = isDerived
  ? !!(derivedConfig?.steps.some((s) => s.kind === "mark-complete"))
  : !!(staticConfig?.wizardSteps.some((s) => s.type === "mark-complete"));
```

One wizard submission covers both the evidence upload and the step completion —
no separate "Mark Complete" tap needed.

---

## View Mode

When `viewId` is set the wizard opens at the review screen.

- **Static path**: `activityToForm()` maps the `ApiRecentActivity` stored in
  `sessionStorage` (`EVIDENCE_SESSION_KEY`) into `LogFormData` and populates the
  review.
- **Derived path**: `dynamicValues` stays empty — the BE does not yet store
  `data.fields` on the submission record, so view mode shows no field values for
  derived steps.

`handleGoToStep` is passed as `onGoToStep` to `ReviewStep` in view mode; it clears
`isViewMode` before jumping to the target step so the user can edit inline.

---

## localStorage Draft

Auto-saved on every state change:

```
key: log-evidence-draft-${stepId}
```

- **Static path**: `{ ...form }` minus `evidenceFiles` (not serialisable).
- **Derived path**: `{ dynamic: { ...dynamicValues } }` minus `File` values.

Draft is cleared on successful submission. Never saved in view mode.

---

## Adding a New Static Step Type

1. **Create the component** in `src/features/challenges/wizard/steps/MyNewStep.tsx`:

```tsx
import { SaveButton } from "../shared";
import type { LogFormData } from "../types";

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
  nextLabel: string;
};

export default function MyNewStep({ form, update, onNext, nextLabel }: Props) {
  return (
    <>
      <div className="px-5 mt-7 mb-6">
        <h1 className="text-[32px] font-bold text-black">My Step</h1>
      </div>
      {/* fields here */}
      <div className="flex-1" />
      <SaveButton label={nextLabel} onClick={onNext} />
    </>
  );
}
```

2. **Add any new fields** to `LogFormData` in `wizard/types.ts` and to `initForm()`.

3. **Add the new `WizardStepType`** literal to `stepFormConfig.ts`.

4. **Register it in the wizard shell** inside the static steps block
   (`{!isDerived && ( ... )}` in `LogEvidenceWizard.tsx`).

5. **Handle it in ReviewStep** if it contributes data to the review summary.

---

## The `nextLabel` "Review" Behaviour

When the step immediately after the current one is `review`, the wizard shell sets
`nextLabel = t("review")`. This is passed to each step component and applied to
`<SaveButton label={nextLabel} />`. No manual config needed.

---

## Retiring Static Config for a Step

The wizard already prefers BE form fields whenever `stepForm` is non-empty. To move
a step from static to derived mode, add `form` fields to the step definition in the
challenge template on the BE — the wizard switches automatically.

To fully retire `stepFormConfig.ts`:

1. Ensure every step has BE form fields.
2. Remove entries from `STEP_FORM_CONFIGS` as they go live on the BE.
3. Delete `stepFormConfig.ts` when empty (keep `WizardStepType` / `FormConfig` types
   only if still needed elsewhere).
