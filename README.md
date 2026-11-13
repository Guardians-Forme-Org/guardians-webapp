# Guardians of the Future — web app

Guardians of the Future is a platform for local groups (circles) running
environmental challenges: composting, tree planting, biodiversity walks, water
saving and more. Each challenge follows a template of steps; groups log evidence
on each step, and the platform turns that evidence into impact totals for every
person, challenge, circle and the platform as a whole.

This repository is the web app (Next.js), installed on phones as a web app. The
API lives in [guardians-api](https://github.com/Guardians-Forme-Org/guardians-api).

## Quick start

```bash
pnpm install
cp .env.example .env.local   # then fill in the values, see docs/02-running-and-releasing.md
pnpm dev                     # http://localhost:3000
```

```bash
pnpm test    # unit tests (vitest)
pnpm lint
pnpm build
```

## Technical guide

Read these in order the first time.

1. [Overview](docs/01-overview.md): the parts of the platform and how they fit together
2. [Running and releasing](docs/02-running-and-releasing.md): environments, branches, deploys
3. [App structure](docs/03-app-structure.md): where things live in this repo
4. [Templates and the evidence form](docs/04-templates-and-the-evidence-form.md): how a template becomes the step-by-step form
5. [A submission end to end](docs/05-a-submission-end-to-end.md): from the form to the impact totals
6. [Roles and permissions](docs/06-roles-and-permissions.md): who can do what, and where it's enforced
7. [Translations](docs/07-translations.md): message files, template text and Crowdin

The API has its own guide in `guardians-api/docs/`: its structure, how impact
is calculated, and the database and template-change workflow.

The admin guide for people running the platform is inside the app, at
`/documentation` (admins only).

### Older notes

`EVIDENCE_WIZARD.md`, `SETUP_UPDATE_FLOW.md`, `ROLES.md` and `ADDING_LANGUAGES.md`
are working notes from mid-2026. They go deeper into some corners of the evidence
form, but parts are out of date. Where they disagree with `docs/`, `docs/` wins.
