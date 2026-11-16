# 2. Running and releasing

## Running the app locally

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

`.env.local` needs:

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_APP_ENV` | `local`, `development`, `staging` or `production`. Shown as a badge outside production. |
| `NEXT_PUBLIC_API_URL` | The API base URL including `/api/v1`. Pointing a local app at the staging API is the quickest way to work on screens. |
| `NEXT_PUBLIC_X_API_KEY` | Sent as `X-Api-Key` on every API call. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps and place search. |
| `NEXT_PUBLIC_SENTRY_DSN` | Error reporting. Leave empty locally. |

Feature switches that aren't secrets live in `config.json`:

- `progressRequiredStepsOnly`: progress counts required steps only.
- `progressOptionalStepsBonus`: completed optional steps can push progress past 100%.
- `canCompleteGateEnabled`: honour a step's `canComplete: false`.

## Checks before pushing

```bash
pnpm test     # vitest unit tests, next to the code they test (*.test.ts)
pnpm lint
pnpm build    # also type-checks
```

## Branches and environments

Both repos move code the same way: feature branch → development → staging → production.

| | Web app branch | API branch | Deploys to |
| --- | --- | --- | --- |
| Development | `development` | `develop` | Vercel preview / dev API server |
| Staging | `staging` | `staging` | staging.theguardians.world / staging API |
| Production | `main` | `main` | app.theguardians.world / production API |

- **Web app:** Vercel builds and deploys every push. The status shows on the
  commit in GitHub.
- **API:** a GitHub Actions workflow per branch (`.github/workflows/*-deployment.yaml`)
  builds a Docker image, pushes it to the registry and restarts the container on
  that environment's server over SSH. Server details are GitHub environment
  secrets (`dev`, `stg`, `prod`).

## A normal release

1. Work on a feature branch off `development` (web app) or `develop` (API).
2. Merge into `development` / `develop`, then check it on the development environment.
3. Merge into `staging`. The team and the client test there.
4. Once signed off, merge into `main`. That is the production deploy.

**Order between the repos.** When a change touches both, release the API first,
then the database change if there is one (see the API's database guide), then the
web app. A new app talking to an old API breaks; an old app talking to a new API
almost never does, because the API only adds fields.

**Urgent fixes** can skip the queue. Cherry-pick the fix onto a branch from
`main` and push that to `main`, then make sure the same commit is also on
`development` and `staging` so the next normal release doesn't drop it.

## After a release

- Pulling down at the top of any page reloads the app. Because the app keeps no
  offline copy, a reload always picks up the latest release.
- Check the deploy status on the commit, then open the changed screen on the
  environment.
