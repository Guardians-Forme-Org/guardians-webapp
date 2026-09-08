# Translation management with Crowdin

Translators — including the client — edit strings in Crowdin's web editor. Crowdin
opens a pull request against this repo when work is done. Nobody outside the dev
team touches JSON or YAML by hand.

Two Crowdin projects are needed, one per repo:

| Repo | Source of truth | Translations land in |
| --- | --- | --- |
| `guardians-webapp` | `messages/en/*.json` | `messages/<lang>/*.json` |
| `guardians-api` | `assets/locales/en.yaml` | `assets/locales/<lang>.yaml` |

English is the only source. Every other locale file is written by Crowdin — edit
English here, edit everything else there.

## One-time setup

### 1. Create the Crowdin projects

At <https://crowdin.com>, create **two** projects:

- Type: **File-based** (not String-based — the round trip through git depends on
  the file mappings in `crowdin.yml`).
- Visibility: **Public**. The free plan allows one private project but unlimited
  public ones, and two projects are needed. Public means the strings are visible
  to anyone with the link; all of this text already ships in the app.
- Source language: **English**.
- Target languages: `hu` at minimum. The repos already carry directories for
  `af`, `fr`, `zu` (webapp) and `es`, `fr`, `hu`, `pt`, `sw`, `ve`, `zu` (api) —
  add only the ones actually being shipped, since unused languages still consume
  the hosted-word allowance.

### 2. Do *not* enable the built-in GitHub integration

Crowdin's *Integrations → GitHub* screen is a different mechanism to the workflow
in `.github/workflows/`, and the two conflict — both push translation branches at
the same repo.

The free plan also allows only **one integration per account**, and there are two
repos here. The GitHub Action authenticates over the API with a personal token, so
it does not consume that quota and works for both. Crowdin's own documentation
describes the Action as the more flexible option.

Leave Integrations untouched in both projects.

### 3. Collect credentials

- **Project ID** — Crowdin → project → *Tools* → *API*.
- **Personal access token** — Crowdin → *Account Settings* → *API* → *New Token*,
  with at least **Manager** scope.

### 4. Add repository secrets

In each repo, *Settings* → *Secrets and variables* → *Actions*:

| Secret | Value |
| --- | --- |
| `CROWDIN_PROJECT_ID` | that repo's project ID |
| `CROWDIN_PERSONAL_TOKEN` | the personal access token |

`GITHUB_TOKEN` is provided by Actions automatically.

### 5. Seed the existing translations

The workflow never uploads translations — it must not overwrite work done in
Crowdin. Push what already exists **once**, from a local checkout:

```bash
export CROWDIN_PROJECT_ID=...
export CROWDIN_PERSONAL_TOKEN=...

npx @crowdin/cli@latest upload sources
npx @crowdin/cli@latest upload translations --auto-approve-imported
```

Run this in each repo. After it, Crowdin shows Hungarian as already translated
rather than an empty project — which is what makes the demo read well.

## Day to day

**Adding or changing English copy** — edit `messages/en/*.json` (or
`assets/locales/en.yaml`) and merge to `development` / `develop`. The workflow
pushes the new strings to Crowdin, where they appear as untranslated.

**Translating** — done in Crowdin's editor. No git, no PR, no dev involvement.

**Getting translations back** — the workflow runs on every source change and
every Monday 06:00 UTC, and can be triggered by hand from the *Actions* tab. It
opens a PR titled `chore(i18n): sync translations from Crowdin` from the branch
`chore/crowdin-translations`. Review and merge it like any other PR.

## Known wrinkles

**The backend YAML exposes 16 junk strings.** `assets/locales/en.yaml` is
go-i18n format:

```yaml
validation_required:
  id: validation_required
  other: "{{.Field}} is required."
```

Crowdin treats every scalar as translatable, so `validation_required` shows up in
the editor next to real sentences. The `id:` line is redundant — go-i18n takes the
message ID from the map key — so deleting those 16 lines fixes it. That changes a
runtime asset, so it needs a deliberate PR and a smoke test of the API's
localised responses, not a drive-by edit.

**`messages/en/splash.json` is `{}`** and is excluded in `crowdin.yml`. Remove
the `ignore` entry once it has content.

**Placeholders.** Strings like `{{.Field}}` (backend) and `{date}` (frontend
ICU) must survive translation intact. Crowdin detects both and will warn a
translator who breaks one, but it is worth checking on the first sync.

**Hosted-word budget.** Crowdin counts source words × target languages. Current
source is ~3,100 words (webapp) and ~140 (api), so four languages across both
repos is ~13,000 against the free plan's reported 60,000. Adding languages is
what costs, not adding strings.
