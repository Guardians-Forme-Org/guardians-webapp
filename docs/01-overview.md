# 1. Overview

## What the platform does

- A **circle** is a local group of Guardians (an organisation, school or
  community).
- A circle runs **challenges**. Each challenge is created from a **template**
  (`CH-001` to `CH-022`), for example CH-004 Compost Sprint or CH-021 Biodiversity
  Mapping Walk.
- A template is a list of **steps**, and each step has a **form**: the questions
  asked when evidence is logged.
- Logging evidence on a step creates an **entry** (stored as a submission). The
  API turns each entry into **impact**: volunteer hours, kilograms of waste
  composted, trees planted, area regenerated, water saved and so on.
- Impact is added up per person, per challenge, per circle and for the whole
  platform.

## The parts

```
 Phone / browser
      │  web app (this repo, Next.js on Vercel)
      ▼
 guardians-api (Go, Docker on a server per environment)
      │                         │
      ▼                         ▼
 Supabase Postgres         Supabase Auth          Supabase Storage
 (circles, challenges,     (accounts, logins,     (photos and files
  templates, entries,       signing keys)          from entries)
  impact records)
```

- **Web app** (`guardians-webapp`): every screen. It talks only to the API, never
  to the database directly. Hosted on Vercel.
- **API** (`guardians-api`): Go with the Fiber web framework. Validates
  requests, checks logins and permissions, stores entries, calculates impact,
  and serves templates in the user's language. Runs as a Docker container per
  environment, deployed by GitHub Actions.
- **Supabase**, one project per environment:
  - Postgres holds all data (tables are listed in the API's database guide).
  - Auth holds accounts and issues login tokens.
  - Storage holds uploaded photos and files.
- **Crowdin** manages translations. English is the source; translators work in
  Crowdin and the results come back into both repos (see
  [Translations](07-translations.md)).
- **Sentry** collects front-end errors; **Vercel Analytics** collects page views.

## Environments

| Environment | App | API |
| --- | --- | --- |
| Development | Vercel preview of `development` | `https://api.dev.theguardians.world/api/v1` |
| Staging | `https://staging.theguardians.world` | `https://api.stg.theguardians.world/api/v1` |
| Production | `https://app.theguardians.world` | `https://api.theguardians.world/api/v1` |

Each environment has its own Supabase project, so accounts and data are
separate. How code moves between them is in
[Running and releasing](02-running-and-releasing.md).

## Main journeys

1. **Sign up and join.** A person signs up (or is created in bulk by support),
   opens a circle or challenge link and taps Join.
2. **Create a circle.** An admin creates a circle and names its leads.
3. **Create a challenge.** An admin or circle lead picks a template, names
   facilitators and publishes. The challenge gets its own copy of the template's
   steps.
4. **Log evidence.** A facilitator, lead or admin opens a step, fills in the form,
   lists the contributors and submits. See
   [A submission end to end](05-a-submission-end-to-end.md).
5. **Complete steps.** Steps are completed with the step's completion switch or
   Mark Complete, and can be reopened to add more evidence.
6. **See impact.** Totals show on the challenge, the circle, each person's
   profile and the platform-wide Home screen.
