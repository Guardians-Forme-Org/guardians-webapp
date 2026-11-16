# 4. Templates and the evidence form

The evidence form is not hand-built per challenge. The app reads the step's form
from the template and builds the screens from it. Changing a question is a
template change, not an app change.

## Where templates live

- **Templates:** the `challengeTemplates` table, one row per template (`CH-001` …
  `CH-022`), with the steps and their forms as JSON. The API seeds them from
  `guardians-api/bin/forms/CH-0XX.json`.
- **A challenge's own copy:** when a challenge is created it copies its
  template's steps into `challenges.challengeSteps`. The challenge's step pages and
  forms come from that copy. So a template change has to update the template
  **and** the copies in existing challenges (see the API's database guide).
- The app reads templates from `GET /templates` and a challenge from
  `GET /challenges/:id`. Both come back in the user's language.

## Shape of a step

A step (`ApiTemplateStep` in `lib/types/challenges.ts`) has a `stepId`, a
`stepNumber`, a title and description, `required` (counts towards progress),
`canComplete`, and a `form`: a list of fields.

A field (`ApiTemplateFormField`) has:

| Property | Meaning |
| --- | --- |
| `name` | The key the answer is sent under. Must match a field the API stores (the Go structs in `guardians-api/core/models`); see `lib/types/contract.ts`. |
| `type` | `TEXT`, `TEXTAREA`, `NUMBER`/`NUMERIC`, `DATE`, `TIME`, `TOGGLE`/`BOOLEAN`, `SELECT`, `MULTISELECT`, `IMAGE`, `FILE`, `LOCATION`, `LOCATION_LIST`, `LIST`, `GROUP`, `ITEM` |
| `label`, `placeholder` | Question text and hint. |
| `required`, `displayOrder` | Validation and order. |
| `options` | Choices for `SELECT`/`MULTISELECT`. Options built from `source` carry `fill`: the registered point's details, filled in when it is picked. |
| `unitOfMeasureOptions` | Units for a number (kg, litres, m², …). |
| `fields`, `addableInput` | For `GROUP`/`ITEM`: the sub-fields, and whether the user can add several entries (e.g. several sites or species). |
| `source` | Fill the choices from data, e.g. the points registered in step 1 (`GET /challenges/:id/register`). |
| `sumOf` | Calculated total of other fields (e.g. total trees from each species row). |

## From template to screens

`features/challenges/lib/deriveWizardConfig.ts` turns a step's form into a list of
screens. `screens/LogEvidenceWizard.tsx` runs them.

1. **Question screens** (`dynamic`): ordinary fields, a few per screen. Heavy
   fields (`LOCATION`, `IMAGE`, `GROUP`, `ITEM`) get a screen of their own.
2. **Points:** a `GROUP` describing places (sites, compost points, water
   points) is where the user adds or picks points.
   - On the setup step, the user registers new points.
   - On later steps, the user picks a registered point and logs a reading
     against it (`setup-update` screen).
3. **Display containers:** a non-addable group such as `siteMetadata` or `area`
   is just a labelled card. The app shows it as one card but sends its fields as
   ordinary top-level answers.
4. **Volunteer hours** and **Contributors** have their own screens. Hours are per
   person. Contributors are chosen from the challenge's members, and are optional
   on a step that already has an entry.
5. **Notes and photo:** every step gets an optional note and photo screen
   (`lib/stepNote.ts`), whether or not the template asks for one.
6. **Completion** (`mark-complete`): when the template has a completion switch,
   switching it on completes the step; leaving it off saves the entry and keeps the
   step open.
7. **Review:** everything entered, then Submit.

Field names are matched loosely (`normalizeFieldName`), so `VOLUNTEER_HOURS` and
`volunteerHours` are the same field. Older templates use the first style, newer
ones the second.

## Saving drafts

A half-filled form is kept in `localStorage` under
`log-evidence-draft-<challengeId>-<stepId>` and restored when the step is opened
again. It's cleared after a successful submit.

## Older static forms

`stepFormConfig.ts` holds hand-written forms from before templates carried their
own forms. A step uses them only when its template has no form. New work should
always go into the template.

## Tests

The tricky template cases have tests next to the code, e.g.
`lib/ch014Steps.test.ts`, `lib/withSumFields.test.ts`,
`lib/ch002LinkedChallenge.test.ts`, `lib/stepNote.test.ts`. They build fields
shaped like the real templates and check the screens and the payload.
