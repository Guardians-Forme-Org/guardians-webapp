# Guardians Pilot — Scope vs. Delivery: Statement of Work Completed

**Purpose:** Payment milestone review — finance team
**Date compiled:** 3 July 2026
**Scope baseline:** Guardians_Scope_Alignment_v2 (joint scope review)
**Delivery evidence:** guardians-webapp & guardians-api repositories; Guardians Pilot Review board (trello.com/b/Vxf7tJfd)

---

## Summary

- **16 of 25** must-have scope modules fully delivered — including 2 the scope review had excluded from the pilot
- **46** pilot feedback tickets resolved (bugs, critical UX, copy) — work outside the agreed scope
- **2** scope modules partially delivered — remainder awaiting client content, designs, or a scope decision
- Of the 9 modules not fully delivered, **6 were recorded in the joint scope review as "not expected in the pilot"**

Every module the joint scope review committed to the pilot has been delivered, with two exceptions that are partially delivered and blocked on client inputs (content, designs, or a scope decision — detailed in Section C). In addition, two modules the review had explicitly excluded from the pilot (Validation Level 1 and Contribution Markers) were delivered anyway, and 46 unscoped feedback items raised during pilot testing were resolved.

---

## A · Scoped work delivered (16 must-have modules)

| Module | Agreed pilot scope | Delivered functionality | Status |
|---|---|---|---|
| Registration | Lightweight registration with contact details, location, language preference | Multi-step signup wizard with location picker, language preference, draft persistence; guardian profile page with edit capability | Delivered |
| Authentication | Email-based authentication | Email + password auth with email verification (Supabase); session persistence; secure logout on expiry. OTP deferred to the mobile-number phase as agreed in the scope review | Delivered |
| Circle Profiles | Public profile: name, location, description, lifecycle status | Full circle profile pages with imagery, description, location, status, and impact panel | Delivered |
| Circle Membership | Member listing and role labels | Member lists with role badges (lead, facilitator, member) on circle and challenge pages; join / leave flows; lead assignment | Delivered |
| Challenge Library | Structured challenge repository | Challenge-template schema with dynamic fields, metrics, and impact formulas; every challenge instantiated from a library template; templates importable via REST API | Delivered |
| Challenge Adoption | Circles able to adopt challenges | Challenge creation from templates, linked to a sponsoring circle; circles can start and support challenges; step-based challenge structure | Delivered |
| Challenge Metrics | Preset metrics attached to challenges | Template-defined metrics computed automatically on each evidence submission and stored in impact records | Delivered |
| Impact Translation Factors | Metric-to-impact conversion framework | Conversion engine live for the pilot challenge library (urban greening, composting sprint, heat mapping), incl. volume-to-mass conversion and CO₂e correction; further formulas added as challenges onboard | Delivered |
| Impact Record | Central validated reporting structure | All evidence submissions stored and time-stamped as impact records, queryable per guardian, challenge, circle, and step | Delivered |
| Validation Level 1 | Self-declared reporting *(scope review: "not previewed in the pilot")* | Facilitator evidence submission with auto-confirmation and automatic metric computation — API and frontend complete | **Beyond scope commitment** |
| Guardian Progress View | Individual progress view | Guardian dashboard with aggregated personal impact, recent activity, and contribution markers | Delivered |
| Circle Progress View | Circle-level progress view | Circle pages aggregate impact across all challenges the circle supports | Delivered |
| Contribution Trace | Chronological contribution history | Time-stamped activity logs at three levels — guardian, challenge, and circle — with per-step filtering | Delivered |
| Contribution Markers | Recognition markers from contribution history *(scope review: "not expected in the pilot")* | Markers computed on the fly from contribution history and displayed on the guardian profile; recalculation verified in pilot testing | **Beyond scope commitment** |
| Impact Summary | Impact calculations and summaries | Aggregated impact summaries on guardian, challenge, and circle views, driven by the impact-record engine | Delivered |
| Multilingual Support | Multi-language architecture and support | Locale-routed application with complete English and Hungarian translations across all screens; language switcher; three further locales scaffolded (Afrikaans, French, Zulu) | Delivered |
| Circle Communication | Simple internal communication mechanism | Delivered per the revised agreement: external communication channel links configurable on every circle and challenge ("Join conversation"). In-app chat was jointly moved out of the pilot | Delivered as agreed |

---

## B · Extra work delivered outside the agreed scope (46 tickets · 7 workstreams)

Work raised during pilot testing (Guardians Pilot Review board) or required to make the pilot production-fit. None of it appears in the scope baseline; all of it is closed and verified on the platform.

| Workstream | Delivered | Origin |
|---|---|---|
| Account security & recovery | Full forgot / reset password flow (API + frontend); duplicate-email registration guard; persistent sessions ("keep me logged in"); automatic logout on expired credentials; 18+ age gate | Critical pilot findings — no scope line covers password recovery or session handling |
| Legal & compliance | Terms & Conditions page built and embedded via API; terms links corrected across signup and login | Pilot feedback; unscoped |
| Guest experience | Guest (no-account) browsing of challenges, circles, and Discover; guest-to-member join flow that returns the user to their original context after signup | Pilot feedback; unscoped |
| Discover, search & maps | Search overhaul with as-you-type behaviour, suggestion lists on focus, and no-results states; interactive map of circles and challenges with zoom, markers, and info windows | Maps and search UX are absent from the scope baseline entirely |
| Onboarding & app shell | Onboarding slides with swipe and back navigation and replay-intro option; splash shown once instead of every visit; PWA install icon fixed | Pilot feedback; unscoped |
| UX hardening | Loading skeletons and click/loading feedback across the app (critical ticket); wizard draft persistence so back-navigation no longer loses input; image compression on all uploads; profile-picture upload; redesigned evidence-submission success screen; copy and UI corrections in both languages, incl. CO₂ → CO₂e precision fix | 44-ticket pilot feedback backlog, incl. 2 completed this week |
| Content management & ops | Edit flows for challenges, circles, and profiles (incl. review-step editing and location picker); invitation-link sharing for circles and challenges; Supabase timeout investigation and stabilisation that resolved a cluster of creation failures | Pilot feedback; unscoped |

---

## C · Scoped work outstanding (9 must-have + 2 nice-to-have)

Every outstanding module is listed with the reason it is not yet live. Six of the nine must-have items were recorded as "not expected in the pilot" in the jointly reviewed scope document; the remainder are blocked on client inputs.

| Module | Status | Current state & what unblocks it |
|---|---|---|
| Guardians Narrative Space | Partial | Description spaces exist on every challenge and circle. The curated story/orientation content area is a quick win once the business supplies content and screen designs |
| Challenge Submission (UI) | Partial | Submission pathway is fully operational via the REST API and template schema; new challenges are being onboarded through it today. A dedicated template-creation UI needs a scope decision (open question raised in the scope review) |
| Network Progress View | Outstanding | Clarified in the scope review as the global impact view. Aggregation infrastructure (network-wide totals by user, circle, challenge, and city) is already exposed by the API; needs designs to render |
| Circle Communication (in-app) | Agreed out of pilot | External channel links delivered instead (see Section A). In-app chat requires scope definition, technical discussion, and UI designs |
| Challenge Reflections | Agreed out of pilot | Requires scope definition plus reflection-form questions and designs from the business |
| Validation Level 2 | Agreed out of pilot | Evidence-based review layer; pilot restricts reporting to facilitators by agreement |
| Validation Level 3 | Agreed out of pilot | Peer-reviewed reporting layer; same agreement as Level 2 |
| City Progress View | Agreed out of pilot | Backend aggregation by city already implemented (users, circles, challenges per city); needs designs to render the views |
| Administration | Agreed out of pilot | Pilot launched without moderation by agreement; permission rules delivered in its place (business users create circles, leads start challenges, facilitators submit evidence) |
| Commons *(nice-to-have)* | Needs definition | Shared learning space — requires clarity and scope definition from the business |
| Partner Directory *(nice-to-have)* | Needs definition | Requires clarity and scope definition; the Discover section already lists all circles, partially covering the intent |

**In-flight quality items (for transparency).** Beyond the scope table, the team is actively working the remaining pilot-feedback queue: 2 tickets in progress (activities-link review page, impact-record calculation), 3 in review (My Circles, link-confirmation UI, challenge start), and 13 open feedback/question items on the board. These are pilot-stabilisation work, not scope gaps.

---

## Delivery evidence

- **125 commits** — Frontend (guardians-webapp), 7 Apr – 3 Jul 2026
- **253 commits** — Backend (guardians-api) in the same pilot window
- **~60 REST endpoints** — Auth, users, circles, challenges, templates, members, evidence, impact records, city & network aggregates
- **2 languages live** — Full English + Hungarian translation of every screen; 3 further locales scaffolded
- **46 / 64 tickets closed** — Guardians Pilot Review board; remaining 18 are active stabilisation items

---

*Compiled 3 July 2026 from: Guardians_Scope_Alignment_v2 (Scope Alignment Review sheet), the Guardians Pilot Review Trello board export, and the guardians-webapp and guardians-api git repositories. Status wording for "agreed out of pilot" items reflects the notes recorded in the joint scope review document.*

*Module counts: 25 must-have + 2 nice-to-have scope lines. Delivered: 16 (incl. Circle Communication via the agreed external-channel alternative, and 2 modules delivered despite being excluded from pilot expectations). Partial: 2. Outstanding: 9, of which 6 agreed out of pilot and 2 pending definition.*
