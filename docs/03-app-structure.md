# 3. App structure

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4. Data fetching
uses TanStack Query; translations use next-intl.

> This Next.js version has breaking changes from older releases. Check
> `node_modules/next/dist/docs/` before relying on remembered APIs (see `AGENTS.md`).

## Folders

```
src/
  app/[locale]/            routes; every URL starts with the language (/en, /hu)
    (auth)/                signed-out pages: splash, onboarding, login, signup,
                           forgot/reset password, terms, privacy
    (app)/                 signed-in pages: home, discover, circles, challenges,
                           profile, documentation
      AppLayoutClient.tsx  sign-in gate, bottom navigation, pull-to-refresh
  features/                screens and their logic, one folder per area
    challenges/            challenge page, step page, create wizard, evidence wizard
    circles/               circle page, members, create/edit wizard
    discover/ home/ profile/ documentation/
  components/              shared UI (components/ui), navigation, providers
  contexts/AuthContext.tsx the signed-in user, session and login data
  lib/
    api.ts                 every API call goes through apiFetch
    auth.ts                session storage (tokens, user, login data)
    hooks/                 TanStack Query hooks per area (challenges, circles, …)
    types/                 API response types; contract.ts mirrors the API's Go structs
    permissions.ts roles.ts who can do what (see Roles and permissions)
    utils.ts               formatting (impact values, progress, labels)
  i18n/                    locales, namespaces, routing
messages/<lang>/*.json     all UI text, one file per namespace
config.json                feature switches
```

Pages under `app/` are thin: they read the route and render a screen from
`features/`. Look in `features/` for the real code.

## Talking to the API

- `lib/api.ts` → `apiFetch` adds the headers on every call:
  - `Authorization: Bearer <access token>`;
  - `X-Api-Key`;
  - `Accept-Language` (the user's language; the API answers in it).
- A `401` means the session couldn't be renewed: the app signs the user out and
  sends them to login.
- Hooks in `lib/hooks/` wrap each endpoint in a TanStack Query query or
  mutation. Mutations invalidate the queries they affect, and a delayed refetch of
  the login data catches changes the API takes a moment to show (see
  `components/providers/QueryProvider.tsx`).

## Sessions

- Login goes through the API (`POST /login`), which signs in with Supabase Auth
  and returns the session (access token and refresh token), the user and their
  **login data**: their circles, challenges and roles.
- `lib/auth.ts` keeps the session in `localStorage`. The access token is renewed
  with the refresh token shortly before it expires, so people stay signed in
  without logging in again every hour.
- `AuthContext` exposes `user`, `loginData`, `isMinor`, `logout` and
  `refreshProfile` (refetches login data and impact after changes).

## Page access

- `AppLayoutClient.tsx` sends signed-out visitors to onboarding, remembering
  where they were going. Home, Discover and circle/challenge pages are readable
  signed out; joining asks them to sign in.
- Screens show or hide actions with the helpers in `lib/permissions.ts`. That's
  for display only: the API enforces the same rules (see
  [Roles and permissions](06-roles-and-permissions.md)).

## Layout conventions

- The app is mobile-first, centred at phone width (`max-w-md`).
- Colours are CSS variables in `app/globals.css`, exposed to Tailwind
  (`bg-gotf-green`, `text-text-muted`, …). Don't hard-code hex values.
- Full-screen flows (create circle, create challenge, the evidence wizard) hide
  the bottom navigation and disable pull-to-refresh, so a reload can't wipe a
  half-filled form. Documents (`/documentation`) hide the navigation only.
- Documents (terms, privacy, admin guide) are JSON in `messages/`, rendered by
  `components/LegalDocument.tsx`, so they're translated like any other text.
