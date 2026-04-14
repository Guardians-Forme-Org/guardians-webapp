@AGENTS.md

# Guardians of the Future — Frontend

## What this is

A civic action platform where community groups (Circles) track and prove real-world
environmental and social impact together. Guardians adopt Challenges, submit reports,
and earn recognition through an Impact Record — a single source of truth that powers
every view in the platform.

This is the Next.js frontend. It connects to a FastAPI backend via a secure API layer.
Never call Supabase directly from the client.

---

## Tech stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Data fetching**: TanStack Query (React Query)
- **Auth**: Magic link + OTP (handled by backend, JWT returned to client)
- **i18n**: i18next — every string must come from the translation table, never hardcoded

---

## Current build status

We are building skeleton screens — black and white, functional, correct routing and state.
Design (colours, typography, final UI) will be applied later by the design team.
Do not add decorative styling. Focus on structure, routing, and data wiring.

Environments already set up:

- Dev: local
- Staging: staging.theguardians.world (Vercel, staging branch)
- Prod: theguardians.world (not live yet)

---

## API base

```
Base URL (staging): https://api.dev.theguardians.world/api/v1
```

All API calls go through TanStack Query hooks in `/hooks`. Never fetch directly in components.

---

## Current seed data (from API)

### Circles — GET /circles

```json
[
  {
    "id": "08d65cbb-ef6f-468e-96e8-dab74bc054cd",
    "name": "Diepkloof Guardians",
    "guardian_id": "1134874c-16c3-4152-954c-606582abaec5",
    "description": "Tree planting in Diepkloof",
    "member_ids": null,
    "created_at": "2026-04-12T12:38:47.481291Z",
    "updated_at": "2026-04-12T12:38:47.481291Z"
  }
]
```

### Challenges — GET /challenges

```json
[
  {
    "id": "f44a537f-da1d-4321-82ce-1a7139a4a609",
    "title": "Newland West Land Care",
    "guardian_id": "1134874c-16c3-4152-954c-606582abaec5",
    "circle_id": null,
    "description": "Newland west land care",
    "region": { "suburb": "New Land West", "city": "Durban" },
    "location": {
      "latitude": -27.0313121,
      "longitude": 28.092811,
      "what3words": "cake.water.mud"
    },
    "status": { "id": "P", "name": "Pending", "code": "PENDING" },
    "category": { "id": "SO", "name": "Soil", "code": "SO" },
    "validation_tier": {
      "level": 1,
      "name": "Self Declared",
      "description": "Submits report form, no evidence required.",
      "code": "SELF_DECLARED"
    }
  }
]
```

### Validation Tiers — GET /validationTiers

```json
[
  { "level": 1, "name": "Self Declared", "code": "SELF_DECLARED" },
  { "level": 2, "name": "Evidence Based", "code": "EVIDENCE_BASED" },
  { "level": 3, "name": "Peer Reviewed", "code": "PEER_REVIEWED" }
]
```

---

## Pages to build

Build these in order. Each page should be functional — correct routing, real data from
API via TanStack Query, loading and error states handled. No placeholder lorem ipsum.
No decorative styling beyond what shadcn provides out of the box.

### 1. Registration — `/register`

Fields: full name, city (text input), language preference (select: English, Spanish, isiZulu).
On submit: POST to `/auth/register`. On success: redirect to `/onboarding`.
No password field. Magic link auth is handled separately.

### 2. Onboarding — `/onboarding`

Multi-step flow. Three steps:

- Step 1: Welcome screen — platform name, one-line description, "Get started" CTA
- Step 2: What is a Circle? — brief explanation, "Browse Circles" or "Create a Circle" CTA
- Step 3: What is a Challenge? — brief explanation, "Browse Challenges" CTA
  State managed with useState. Progress indicator at top (1 of 3 style). On complete: redirect to `/circles`.

### 3. Circle list — `/circles`

Fetch from GET /circles via TanStack Query.
Display: name, description, member count (null = 0 for now), created date.
Include a "Create Circle" button linking to `/circles/new`.
Loading skeleton while fetching. Empty state if no results.

### 4. Circle detail — `/circles/[id]`

Fetch single circle by ID. Display: name, description, status badge, guardian ID (for now),
created date. Placeholder sections for: Members, Active Challenges, Impact (empty for now).
"Back to Circles" link.

### 5. Circle creation — `/circles/new`

Form fields: name (text), description (textarea), location/city (text).
On submit: POST to `/circles`. On success: redirect to `/circles/[newId]`.
Cancel link back to `/circles`.

### 6. Challenge library — `/challenges`

Fetch from GET /challenges via TanStack Query.
Display: title, description, category badge, validation tier badge (level + name),
region (suburb + city), status badge.
Filter bar at top: filter by category, filter by validation tier. Both use select inputs.
Loading skeleton. Empty state.

### 7. Challenge detail — `/challenges/[id]`

Fetch single challenge by ID. Display all fields from the seed data above.
Validation tier displayed prominently — level number, name, description.
Location section: suburb, city, what3words. Category badge.
"Submit a Report" CTA button — links to `/reports/new?challengeId=[id]`.
Placeholder section for: Circles working on this challenge (empty for now).
"Back to Challenges" link.

### 8. Report submission — `/reports/new`

Query param: `challengeId` — fetch challenge details to display context at top of form.
Step 1 — always shown: metric fields (for now just a single textarea "Describe what you did"
and a number input "Quantity"). Validation tier determines next step.
Step 2 — L2 only: file upload field for photo or document evidence.
Step 3 — L3 only: peer verifier input (Guardian ID for now, email lookup later).
On submit: POST to `/reports`. Success: confirmation screen with "View your Circle" CTA.

### 9. Admin queue — `/admin/queue`

Fetch from GET /admin/reports/pending (stub this endpoint if not live yet —
return empty array, build the UI anyway).
Display list of pending L2 reports: Circle name, Challenge title, submitted date, evidence link.
Each row has three actions: Approve, Reject, Request More Info.
On action: PATCH to `/admin/reports/[id]` with status payload.
Confirmation toast on success. Error state on failure.
Simple auth guard — redirect to `/` if no admin token in session.

---

## Routing structure

```
app/
  (auth)/
    register/page.tsx
    onboarding/page.tsx
  (main)/
    circles/
      page.tsx              ← list
      new/page.tsx          ← create
      [id]/page.tsx         ← detail
    challenges/
      page.tsx              ← library
      [id]/page.tsx         ← detail
    reports/
      new/page.tsx          ← submission form
  (admin)/
    admin/
      queue/page.tsx
  page.tsx                  ← root, redirect to /register or /circles based on auth
```

---

## Shared hooks (build these first)

```
hooks/
  useCircles.ts         ← GET /circles
  useCircle.ts          ← GET /circles/[id]
  useCreateCircle.ts    ← POST /circles
  useChallenges.ts      ← GET /challenges
  useChallenge.ts       ← GET /challenges/[id]
  useSubmitReport.ts    ← POST /reports
  useAdminQueue.ts      ← GET /admin/reports/pending
  useReviewReport.ts    ← PATCH /admin/reports/[id]
```

---

## Key rules — read before writing any code

1. **No hardcoded strings** — every user-facing string goes through i18next `t()`.
   Even in skeleton phase. This is non-negotiable.

2. **No direct Supabase calls** — all data through the API layer.

3. **TanStack Query for everything** — no raw useEffect fetching.

4. **Loading and error states on every page** — use shadcn Skeleton for loading,
   a simple error card for errors.

5. **Mobile first** — every page must be usable on a phone.

6. **TypeScript strict** — no `any`. Define types for every API response shape.

7. **i18n from day one** — wrap every string. Translation files live in `/messages`.
   Start with `en.json`. Keys follow dot notation: `circles.list.title`.

---

## Types to define upfront

```typescript
// types/index.ts

export type ValidationTier = {
  level: 1 | 2 | 3;
  name: string;
  description: string;
  code: "SELF_DECLARED" | "EVIDENCE_BASED" | "PEER_REVIEWED";
};

export type Circle = {
  id: string;
  name: string;
  guardian_id: string;
  description: string;
  member_ids: string[] | null;
  created_at: string;
  updated_at: string;
};

export type ChallengeStatus = {
  id: string;
  name: string;
  code: string;
};

export type ChallengeCategory = {
  id: string;
  name: string;
  code: string;
};

export type ChallengeLocation = {
  id?: string;
  latitude: number;
  longitude: number;
  address?: string;
  what3words?: string;
};

export type ChallengeRegion = {
  id?: string;
  suburb: string;
  city: string;
};

export type Challenge = {
  id: string;
  title: string;
  guardian_id: string;
  circle_id: string | null;
  description: string;
  region: ChallengeRegion;
  location: ChallengeLocation;
  status: ChallengeStatus;
  category: ChallengeCategory;
  completed_date: string | null;
  created_at: string;
  modified_at: string;
  validation_tier: ValidationTier;
};

export type Report = {
  id: string;
  challenge_id: string;
  circle_id: string;
  guardian_id: string;
  validation_tier: ValidationTier;
  description: string;
  quantity: number;
  evidence_url?: string;
  verifier_id?: string;
  status: string;
  submitted_at: string;
};
```

---

## What done looks like

Each page is complete when:

- It fetches real data from the API (or stubs gracefully if endpoint not live)
- Loading state shows a skeleton
- Error state shows a useful message
- All strings go through i18next
- It is navigable — links in and links out work
- It renders correctly on mobile
- TypeScript compiles with no errors

Design is NOT part of done at this stage. Shadcn defaults are fine.
The goal is a working, navigable, data-connected skeleton.
