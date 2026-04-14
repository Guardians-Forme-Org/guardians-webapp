# Challenge Library — Navigation & Filter Implementation

## Overview

The Challenge Library uses a two-tier navigation system (Option D — Hybrid).
Primary navigation is by impact domain. Secondary filters refine within the selected domain.
A guided finder is available as a secondary entry point for new users.

This document is the implementation reference. Follow it exactly.

---

## Data model

### Challenge tag object

Every challenge has a flat `tags` object. No nested categories. No free-text.

```typescript
export type ChallengeDomain =
  | 'mitigation'
  | 'resilience'
  | 'democratic_infrastructure'
  | 'regeneration'

export type ChallengeTimeCommitment =
  | 'half_day'
  | 'full_day'
  | 'multi_day'
  | 'multi_week'
  | 'ongoing'

export type ChallengeTeamSize =
  | 'individual'
  | 'small'       // 2–5
  | 'circle'      // 6–20
  | 'large'       // 20+

export type ChallengeSetting =
  | 'indoor'
  | 'outdoor'
  | 'both'

export type ChallengeSeason =
  | 'year_round'
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'

export type ChallengeResourceLevel =
  | 'low'         // no equipment or cost required
  | 'medium'      // some materials or coordination needed
  | 'high'        // specialist equipment or significant cost

export type ChallengeTags = {
  domain: ChallengeDomain[]          // can belong to multiple domains
  time: ChallengeTimeCommitment
  team: ChallengeTeamSize
  setting: ChallengeSetting
  season: ChallengeSeason
  resources: ChallengeResourceLevel
  validation: 'L1' | 'L2' | 'L3'
}
```

### Extended Challenge type

```typescript
export type Challenge = {
  id: string
  title: string
  description: string
  guardian_id: string
  circle_id: string | null
  region: ChallengeRegion
  location: ChallengeLocation
  status: ChallengeStatus
  category: ChallengeCategory
  tags: ChallengeTags              // ← required on every challenge
  validation_tier: ValidationTier
  metric_definitions: MetricDefinition[]
  completed_date: string | null
  created_at: string
  modified_at: string
}
```

---

## Design tokens — domain colours

Define once. Use everywhere — tabs, cards, filter pills, detail pages.
Never hardcode hex values inline. Always reference these tokens.

```css
/* globals.css */
:root {
  --domain-mitigation:              #27500A;
  --domain-mitigation-bg:           #EAF3DE;
  --domain-mitigation-border:       #B8D9A0;

  --domain-resilience:              #0A3D50;
  --domain-resilience-bg:           #DEF0F3;
  --domain-resilience-border:       #A0CDD9;

  --domain-democratic:              #4A2D00;
  --domain-democratic-bg:           #F5ECD6;
  --domain-democratic-border:       #D9C090;

  --domain-regeneration:            #3D0A27;
  --domain-regeneration-bg:         #F3DEE8;
  --domain-regeneration-border:     #D9A0C0;
}
```

In Tailwind, extend the config:

```js
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      domain: {
        mitigation:   { DEFAULT: '#27500A', bg: '#EAF3DE', border: '#B8D9A0' },
        resilience:   { DEFAULT: '#0A3D50', bg: '#DEF0F3', border: '#A0CDD9' },
        democratic:   { DEFAULT: '#4A2D00', bg: '#F5ECD6', border: '#D9C090' },
        regeneration: { DEFAULT: '#3D0A27', bg: '#F3DEE8', border: '#D9A0C0' },
      }
    }
  }
}
```

---

## Filter logic

**AND between dimensions, OR within a dimension.**

```
selected domains: [mitigation, resilience]
selected time: [half_day, full_day]

result: challenges where
  (domain includes mitigation OR resilience)
  AND
  (time is half_day OR full_day)
```

Implementation:

```typescript
export function filterChallenges(
  challenges: Challenge[],
  filters: ActiveFilters
): Challenge[] {
  return challenges.filter(challenge => {
    const { tags } = challenge

    if (filters.domains.length > 0) {
      const domainMatch = filters.domains.some(d => tags.domain.includes(d))
      if (!domainMatch) return false
    }

    if (filters.time.length > 0) {
      if (!filters.time.includes(tags.time)) return false
    }

    if (filters.team.length > 0) {
      if (!filters.team.includes(tags.team)) return false
    }

    if (filters.validation.length > 0) {
      if (!filters.validation.includes(tags.validation)) return false
    }

    return true
  })
}

export type ActiveFilters = {
  domains: ChallengeDomain[]
  time: ChallengeTimeCommitment[]
  team: ChallengeTeamSize[]
  validation: ('L1' | 'L2' | 'L3')[]
}

export const emptyFilters: ActiveFilters = {
  domains: [],
  time: [],
  team: [],
  validation: [],
}
```

---

## Page structure — `/challenges`

```
┌─────────────────────────────────────────────────────┐
│  Challenge Library                    Not sure? →   │
│  [subtitle]                                         │
├─────────────────────────────────────────────────────┤
│  [ All ] [ Mitigation ] [ Resilience ]              │  ← Primary domain tabs
│          [ Democratic ] [ Regeneration ]            │
├─────────────────────────────────────────────────────┤
│  Time: [Half-day] [Full-day] [Multi-week]           │  ← Secondary filter bar
│  Team: [Individual] [Small] [Circle]                │
│  Level: [L1] [L2] [L3]                              │
├─────────────────────────────────────────────────────┤
│  Showing 6 challenges                    Sort ↓     │
├─────────────────────────────────────────────────────┤
│  [ Card ] [ Card ] [ Card ]                         │
│  [ Card ] [ Card ] [ Card ]                         │
└─────────────────────────────────────────────────────┘
```

---

## Component breakdown

### `ChallengeDomainTabs`

Primary navigation. One tab per domain plus "All".
Active tab highlights in domain colour. Selecting a tab sets `filters.domains`.
Selecting "All" clears `filters.domains`.

```typescript
// components/challenges/ChallengeDomainTabs.tsx

const DOMAINS = [
  { key: 'all',                    label: 'All' },
  { key: 'mitigation',             label: 'Mitigation & Circularity' },
  { key: 'resilience',             label: 'Resilience & Biodiversity' },
  { key: 'democratic_infrastructure', label: 'Democratic Infrastructure' },
  { key: 'regeneration',           label: 'Regeneration' },
] as const
```

Props:
```typescript
type Props = {
  active: ChallengeDomain[]
  onChange: (domains: ChallengeDomain[]) => void
}
```

### `ChallengeFilterBar`

Secondary filter bar. Three filter groups always visible: Time, Team, Level.
Each group renders as a row of toggle pills.
Active pills show filled background. Inactive pills show outline.

```typescript
// components/challenges/ChallengeFilterBar.tsx

type Props = {
  filters: ActiveFilters
  onChange: (filters: ActiveFilters) => void
}
```

### `ChallengeCard`

Displays a single challenge in the grid.
Tag strip at bottom shows all tags — domain colour badge, time, team, validation level.
Cards are always the same height. Description truncates at 2 lines.

```typescript
// components/challenges/ChallengeCard.tsx

type Props = {
  challenge: Challenge
}
```

Card structure:
```
┌──────────────────────────────────┐
│  [Domain colour bar at top]      │
│                                  │
│  Title                           │
│  Description (2 lines max)       │
│                                  │
│  Region · City                   │
│                                  │
│  ──────────────────────────────  │
│  [Domain] [Time] [Team] [Level]  │  ← tag strip
└──────────────────────────────────┘
```

### `ChallengeGrid`

Renders the filtered challenge list.
3 columns on desktop, 2 on tablet, 1 on mobile.
Shows loading skeletons while fetching.
Shows empty state when no challenges match filters.

```typescript
// components/challenges/ChallengeGrid.tsx

type Props = {
  challenges: Challenge[]
  isLoading: boolean
}
```

### `GuidedFinder`

Question-by-question flow. Three questions:
1. What matters most to your Circle? (domain selection)
2. How much time can you commit? (time selection)
3. How big is your Circle? (team size)

Match result: sort challenges by how many selected criteria they satisfy.
Show "Strong match", "Good match", "Possible" labels.

Matching logic:
```typescript
function scoreChallenge(challenge: Challenge, answers: FinderAnswers): number {
  let score = 0
  if (answers.domain && challenge.tags.domain.includes(answers.domain)) score++
  if (answers.time && challenge.tags.time === answers.time) score++
  if (answers.team && challenge.tags.team === answers.team) score++
  return score
}

function matchLabel(score: number): 'Strong match' | 'Good match' | 'Possible' {
  if (score === 3) return 'Strong match'
  if (score === 2) return 'Good match'
  return 'Possible'
}
```

Entry point: "Not sure? Try the finder →" link in top-right of library header.
Renders as a modal or a slide-in panel — not a separate page.

```typescript
// components/challenges/GuidedFinder.tsx

type FinderAnswers = {
  domain: ChallengeDomain | null
  time: ChallengeTimeCommitment | null
  team: ChallengeTeamSize | null
}
```

---

## State management

All filter state lives in the page component, passed down as props.
Use URL search params to persist filter state — users should be able to share a filtered URL.

```typescript
// app/(main)/challenges/page.tsx

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useMemo } from 'react'
import { useChallenges } from '@/hooks/useChallenges'
import { filterChallenges, emptyFilters } from '@/lib/filterChallenges'

export default function ChallengesPage() {
  const { data: challenges, isLoading } = useChallenges()
  const [filters, setFilters] = useState<ActiveFilters>(emptyFilters)
  const [finderOpen, setFinderOpen] = useState(false)

  const filtered = useMemo(
    () => filterChallenges(challenges ?? [], filters),
    [challenges, filters]
  )

  return (
    <div>
      <header>
        <h1>{t('challenges.library.title')}</h1>
        <button onClick={() => setFinderOpen(true)}>
          {t('challenges.library.finder_cta')}
        </button>
      </header>

      <ChallengeDomainTabs
        active={filters.domains}
        onChange={domains => setFilters(f => ({ ...f, domains }))}
      />

      <ChallengeFilterBar
        filters={filters}
        onChange={setFilters}
      />

      <p>{t('challenges.library.showing', { count: filtered.length })}</p>

      <ChallengeGrid
        challenges={filtered}
        isLoading={isLoading}
      />

      <GuidedFinder
        open={finderOpen}
        onClose={() => setFinderOpen(false)}
        challenges={challenges ?? []}
      />
    </div>
  )
}
```

---

## i18n keys

Add these to `messages/en.json`:

```json
{
  "challenges": {
    "library": {
      "title": "Challenge Library",
      "subtitle": "Find an action that fits your Circle",
      "finder_cta": "Not sure? Try the finder",
      "showing": "Showing {{count}} challenges",
      "empty": "No challenges match your filters",
      "empty_cta": "Clear filters"
    },
    "domains": {
      "all": "All",
      "mitigation": "Mitigation & Circularity",
      "resilience": "Resilience & Biodiversity",
      "democratic_infrastructure": "Democratic Infrastructure",
      "regeneration": "Regeneration"
    },
    "filters": {
      "time": "Time",
      "team": "Team",
      "level": "Level",
      "half_day": "Half-day",
      "full_day": "Full-day",
      "multi_day": "Multi-day",
      "multi_week": "Multi-week",
      "ongoing": "Ongoing",
      "individual": "Individual",
      "small": "Small group",
      "circle": "Full Circle",
      "large": "Large group"
    },
    "finder": {
      "title": "Find your challenge",
      "q1": "What matters most to your Circle?",
      "q2": "How much time can you commit?",
      "q3": "How big is your Circle?",
      "strong_match": "Strong match",
      "good_match": "Good match",
      "possible": "Possible",
      "back": "Back",
      "see_results": "See matches"
    },
    "card": {
      "adopt": "Adopt this challenge",
      "view": "View details"
    }
  }
}
```

---

## File structure

```
app/
  (main)/
    challenges/
      page.tsx                        ← library page

components/
  challenges/
    ChallengeDomainTabs.tsx
    ChallengeFilterBar.tsx
    ChallengeCard.tsx
    ChallengeGrid.tsx
    ChallengeCardSkeleton.tsx
    ChallengeEmptyState.tsx
    GuidedFinder.tsx
    GuidedFinderStep.tsx

lib/
  filterChallenges.ts                 ← pure filter function, fully tested
  challengeDomains.ts                 ← domain labels and colour token mapping

types/
  challenges.ts                       ← all challenge-related types including ChallengeTags
```

---

## Build order

1. Define types in `types/challenges.ts`
2. Define domain colour mapping in `lib/challengeDomains.ts`
3. Write and test `lib/filterChallenges.ts` — pure function, no UI
4. Build `ChallengeCard` with tag strip
5. Build `ChallengeCardSkeleton` matching card dimensions
6. Build `ChallengeGrid` with loading and empty states
7. Build `ChallengeDomainTabs`
8. Build `ChallengeFilterBar`
9. Wire page with filter state
10. Build `GuidedFinder` last — it's a progressive enhancement, not a blocker

---

## Rules

- Domain colours come from tokens only — never hardcode hex values in components
- Filter logic lives in `lib/filterChallenges.ts` — never inline in components
- Every string goes through `t()` — no exceptions
- Filter state must survive a page refresh — use URL search params
- Mobile layout is the primary layout — design card and filter bar for 375px first
- `GuidedFinder` must not block the main library from loading
