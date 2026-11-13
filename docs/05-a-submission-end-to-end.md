# 5. A submission end to end

Follow one entry from the form to the numbers on Home. Example: a facilitator
logs step 2 of a CH-004 Compost Sprint: 40 kg of organic waste, 3 contributors,
2 hours each.

## 1. The form builds the payload

`LogEvidenceWizard.tsx` collects the answers (see
[Templates and the evidence form](04-templates-and-the-evidence-form.md)) and
builds a **submission**:

```jsonc
{
  "thingId": "<challengeId>",        // the challenge
  "circleId": "<circleId>",
  "challengeCode": "CH-004",
  "stepId": "logWasteAndComposting",
  "stepType": "...",
  "dataEnvelope": {
    "volunteerHours": { "value": 2, "unitOfMeasure": "hours" },
    "contributors": ["<userId>", "<userId>", "<userId>"],
    "notes": "…",                      // the optional note
    "anchorPoint": { … }               // the step's answers, shaped like the Go structs
  }
}
```

- The answers go in `dataEnvelope`, using the field names the API's Go structs
  expect (`guardians-api/core/models/envelope.go`; mirrored in
  `lib/types/contract.ts`). An answer under a name the API doesn't know is
  silently dropped, so new fields need an API change first.
- Photos and files are sent alongside as form parts:
  - `mediaFiles[<id>]`, where `<id>` matches a `mediaFileReferenceId` set on the
    point or row the file belongs to;
  - `mediaFile` for a single file;
  - `notePhoto` for the note's photo.
- Photos are compressed in the browser before upload (`lib/compressImage.ts`).

## 2. Where it is sent

| Step | Request |
| --- | --- |
| The first (setup) step | `POST /challengeSetup` |
| Any other step | `POST /submit<code>`, e.g. `/submitCH004`, as `multipart/form-data` with the submission JSON in the `metadata` part |

Both carry the user's access token. The API verifies it and checks that the user
may log evidence on this challenge before doing anything else (see
[Roles and permissions](06-roles-and-permissions.md)).

## 3. The API stores it

In `guardians-api`:

1. **Handler** (`handlers/submisions.go`) reads `metadata`, uploads each file
   part to Supabase Storage and puts the file's URL on the matching point or row.
2. **Service** (`core/services/submissions.go`) passes it to the repository.
   Challenges with their own rules have their own path (CH-004, CH-008B, CH-011,
   CH-012B, CH-015, CH-016, CH-019); the rest use the generic one.
3. **Repository** (`repository/supabasedb/submissions.go`) inserts the row into
   `evidenceSubmissions`. A setup submission also becomes the challenge's
   `submittedSetupDetail`, which later steps read (the registered points). It
   replaces the previous one wholesale, which is why the app pre-fills step 1
   with the earlier points and region when it's submitted again.

## 4. The API calculates impact

Still in the repository, straight after the insert:

- **Volunteer hours:** each contributor is credited with the hours entered (2 h
  each). The challenge, its circle and `GLOBAL` are credited hours × contributors
  (6 h).
- **Challenge numbers:** the step's own numbers become impact using the
  template's rules. For CH-004: 40 kg collected organic waste, and the CO₂ that
  composting it avoids. Planting steps add trees, gardens add area, water steps
  add litres saved, count-style steps add tiles such as households reached.
- **Who is credited:** each impact goes to the contributors, the challenge (its
  `thingId`), its circle and `GLOBAL`.
- **Where it's kept:** `impactRecords` has one row per credited thing (a user,
  challenge, circle or `GLOBAL`) holding one record per metric (`siUnit`, e.g.
  `VOLUNTEER_HOURS`, `COLLECTED_ORGANIC_WASTE`). Each submission adds to those
  running totals.

Details and the formulas are in the API's impact guide.

## 5. Completing the step

If the completion switch was on, the app then sends
`PUT /challenges/:id/steps` with the full step and `isCompleted: true`. The API
keeps the step's stored text and form and changes only the flags. Reopening
sends the same call with `isCompleted: false`.

## 6. Reading it back

| Screen | Request |
| --- | --- |
| Step page, list of entries | `GET /recentActivities/:challengeId?stepId=…` |
| One entry | `GET /evidences/:id` |
| Challenge / circle / profile impact | `GET /thingImpactRecords/:thingId` |
| Circle activity | `GET /circleRecentActivities/:circleId` |
| Home | `GET /publicMatrix`: the `GLOBAL` totals for the seven headline metrics, plus how many circles, challenges and Guardians there are |

Entries come back with `data` and `dataEnvelope`. The app merges the two
(`dataEnvelope` wins), because older entries were stored under `data`.

## Things to know

- **Entries are append-only.** There is no edit or delete in the app; every
  entry adds to the totals. A correction is made with a script (see the API's
  database guide).
- **Contributors must be challenge members.** The contributor list comes from the
  challenge's members, so people need to join the challenge to be credited.
