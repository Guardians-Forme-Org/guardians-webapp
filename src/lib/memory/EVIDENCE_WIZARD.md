# Evidence Wizard — Developer Guide

## Overview

`LogEvidenceWizard` is the single wizard engine for all challenge step submissions.
It is **config-driven**: a `stepId` maps to a `FormConfig` which declares which step
components to render, in order. The wizard shell manages state, localStorage drafts,
and API submission. All form UI lives in isolated step components.

---

## File Structure

```
src/features/challenges/
  stepFormConfig.ts          ← step registry (FE mock, move to BE later)
  wizard/
    types.ts                 ← LogFormData type + initForm()
    shared.tsx               ← reusable UI primitives
    steps/
      SiteDetailsStep.tsx
      LocationPhotosStep.tsx
      SiteConditionStep.tsx
      InterventionsStep.tsx
      MetricsStep.tsx
      FileUploadStep.tsx
      ImpactStep.tsx
      RegionStep.tsx
      ContributorsStep.tsx
      MarkCompleteStep.tsx
      ReviewStep.tsx
    SuccessScreen.tsx
  screens/
    LogEvidenceWizard.tsx    ← thin shell only (~130 lines)
```

---

## Adding a New Challenge Template

A new template needs a new entry in `stepFormConfig.ts`. The key is the `stepId`
from the challenge payload.

```ts
// stepFormConfig.ts
export const STEP_FORM_CONFIGS: Record<string, FormConfig> = {
  // existing entries...

  MY_NEW_STEP_ID: {
    wizardSteps: [
      { type: "file-upload" },
      { type: "impact" },
      { type: "contributors" },
      { type: "review" },
    ],
  },
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
| `region` | Location picker (standalone region search) |
| `contributors` | Member search/chips — who performed the action |
| `mark-complete` | Simple confirmation button |
| `review` | Read-only summary of all collected data + Upload/Delete buttons |

> `review` should almost always be the last step before success.
> `mark-complete` submits directly (no review step needed).

### Typical compositions

```ts
// evidence upload flow
{ type: "file-upload" }, { type: "impact" }, { type: "contributors" }, { type: "review" }

// site registration flow
{ type: "file-upload" }, { type: "region" }, { type: "contributors" }, { type: "review" }
```

---

## Adding a New Step Type

1. **Create the component** in `src/features/challenges/wizard/steps/MyNewStep.tsx`:

```tsx
import { SaveButton } from "../shared";
import type { LogFormData } from "../types";

type Props = {
  form: LogFormData;
  update: (k: keyof LogFormData, v: unknown) => void;
  onNext: () => void;
  nextLabel: string; // "Save" or "Review" — passed from wizard shell
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

3. **Add the new `WizardStepType`** literal to `stepFormConfig.ts`:

```ts
export type WizardStepType =
  | "site-details"
  // ... existing types
  | "my-new-step"; // ← add here
```

4. **Register it in the wizard shell** (`screens/LogEvidenceWizard.tsx`):

```tsx
import MyNewStep from "../wizard/steps/MyNewStep";

// inside the step renderer:
{
  currentStepType === "my-new-step" && (
    <MyNewStep
      form={form}
      update={update}
      onNext={next}
      nextLabel={nextLabel}
    />
  );
}
```

5. **Handle it in ReviewStep** (`wizard/steps/ReviewStep.tsx`) if the review should
   show data collected by this step:

```tsx
const hasMyStep = stepTypes.includes("my-new-step");
// then conditionally render review fields
```

---

## Updating an Existing Step

Edit the component file directly in `wizard/steps/`. Each component receives:

- `form: LogFormData` — full form state (read-only, use `update()` to change)
- `update(key, value)` — updates a single field in form state
- `onNext()` — advance to the next step (or submit if last step)
- `nextLabel` — the button label; will be `"Review"` if the next step is review

Changes to a step's fields should also be reflected in `ReviewStep.tsx` if that
step's data is shown in the review summary.

> `ContributorsStep` additionally receives `members` and `users` props from the
> wizard shell — it is the only step that needs them.

---

## The `nextLabel` "Review" Behaviour

When the step immediately following the current one is `"review"`, the wizard shell
automatically sets `nextLabel = "Review"`. This is passed to each step component
and applied to `<SaveButton label={nextLabel} />`. No manual config needed.

---

## localStorage Draft

The wizard auto-saves form state on every change:

```
key: log-evidence-draft-${stepId}
```

`File` objects are excluded (not serialisable). On reload, `evidenceFiles` is reset
to `[]`. The draft is cleared on successful submission and on "Delete Impact".

---

## Submission

The wizard submits via `useSubmitEvidence()` in the shell. It builds the payload from
`form.impactDescription || form.siteCondition` as the description, and
`form.contributors` as the contributor list.

When the BE adds richer payload fields per step type, update the `submit()` function
in `LogEvidenceWizard.tsx` — it's the only place API calls happen.

---

## Moving Config to the BE

Currently `STEP_FORM_CONFIGS` is a FE mock keyed by `stepId`. When the BE is ready:

1. Add `formConfig: { wizardSteps: { type: WizardStepType }[] }` to the step
   definition in the challenge payload.
2. In `LogEvidenceWizard.tsx`, replace:
   ```ts
   const config = STEP_FORM_CONFIGS[stepId] ?? DEFAULT_FORM_CONFIG;
   ```
   with:
   ```ts
   const config = stepMeta?.formConfig ?? DEFAULT_FORM_CONFIG;
   ```
3. Delete `stepFormConfig.ts` (or keep `WizardStepType` / `FormConfig` types there).
